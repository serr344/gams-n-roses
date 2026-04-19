import React, { useMemo, useState } from "react";
import {
  BUILD_ITEM_MAP,
  type BuildItemId,
} from "../data/buildItems";

export type PlacedItem = {
  uid: string;
  itemId: BuildItemId;
  col: number;
  row: number;
};

type LayoutGridProps = {
  columns: number;
  rows: number;
  cellSize: number;
  placedItems: PlacedItem[];
  remainingBudget: number;
  draggedItemId: BuildItemId | null;
  canPlaceItemAt: (itemId: BuildItemId, col: number, row: number) => boolean;
  onPlaceItem: (itemId: BuildItemId, col: number, row: number) => void;
};

const LayoutGrid: React.FC<LayoutGridProps> = ({
  columns,
  rows,
  cellSize,
  placedItems,
  remainingBudget,
  draggedItemId,
  canPlaceItemAt,
  onPlaceItem,
}) => {
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null);

  const occupiedMap = useMemo(() => {
    const occupied = new Set<string>();

    placedItems.forEach((placed) => {
      const def = BUILD_ITEM_MAP[placed.itemId];
      for (let r = 0; r < def.height; r++) {
        for (let c = 0; c < def.width; c++) {
          occupied.add(`${placed.col + c}-${placed.row + r}`);
        }
      }
    });

    return occupied;
  }, [placedItems]);

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    col: number,
    row: number
  ) => {
    e.preventDefault();

    const itemId = e.dataTransfer.getData("text/plain") as BuildItemId;
    if (!itemId) return;

    onPlaceItem(itemId, col, row);
    setHoverCell(null);
  };

  const previewRect =
    draggedItemId && hoverCell
      ? {
          itemId: draggedItemId,
          col: hoverCell.col,
          row: hoverCell.row,
          valid: canPlaceItemAt(draggedItemId, hoverCell.col, hoverCell.row),
        }
      : null;

  return (
    <div className="layout-grid-wrapper">
      <div className="layout-grid-topbar">
        <div>
          <strong>Grid:</strong> {columns} x {rows}
        </div>
        <div>
          <strong>Budget Left:</strong> ${remainingBudget}
        </div>
        <div>
          <strong>Drag an item</strong> from the right panel
        </div>
      </div>

<div
  className="layout-grid"
  style={{
    gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
  }}
>
        {Array.from({ length: rows }).flatMap((_, row) =>
          Array.from({ length: columns }).map((__, col) => {
            const key = `${col}-${row}`;
            const occupied = occupiedMap.has(key);

            return (
              <div
                key={key}
                className={`layout-grid-cell ${occupied ? "occupied" : ""}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setHoverCell({ col, row });
                }}
                onDrop={(e) => handleDrop(e, col, row)}
              />
            );
          })
        )}

        {placedItems.map((placed) => {
          const def = BUILD_ITEM_MAP[placed.itemId];

          return (
            <div
              key={placed.uid}
              className="layout-grid-item"
              style={{
                left: 16 + placed.col * (cellSize + 2),
                top: 16 + placed.row * (cellSize + 2),
                width: def.width * cellSize + (def.width - 1) * 2,
                height: def.height * cellSize + (def.height - 1) * 2,
                background: def.color,
              }}
            >
              {def.icon ? (
                <img
                  src={def.icon}
                  alt={def.name}
                  className="layout-grid-item-image"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              <span>{def.name}</span>
            </div>
          );
        })}

        {previewRect && (() => {
          const def = BUILD_ITEM_MAP[previewRect.itemId];
          return (
            <div
              className={`layout-grid-preview ${previewRect.valid ? "valid" : "invalid"}`}
              style={{
                left: 16 + previewRect.col * (cellSize + 2),
                top: 16 + previewRect.row * (cellSize + 2),
                width: def.width * cellSize + (def.width - 1) * 2,
                height: def.height * cellSize + (def.height - 1) * 2,
              }}
            />
          );
        })()}
      </div>
    </div>
  );
};

export default LayoutGrid;