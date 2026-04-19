import React, { useMemo, useState } from "react";
import type { Venue } from "../App";
import MapCanvas from "../map/components/MapCanvas";
import type {
  CandidateSite,
  MapBuilding,
  VenueMapProfile,
} from "../map/types/map";
import LayoutGrid, { type PlacedItem } from "../components/LayoutGrid";
import {
  BUILD_ITEMS,
  BUILD_ITEM_MAP,
  type BuildItemId,
} from "../data/buildItems";

type BuildPageProps = {
  selectedVenue: Venue | null;
  onBack: () => void;
  onFinish: (data: {
    finalScore: number;
    safeLimit: number;
    usedBudget: number;
    totalBudget: number;
  }) => void;
};

type BuildPhase = "site-selection" | "layout-building";

const GRID_COLUMNS = 14;
const GRID_ROWS = 9;
const CELL_SIZE = 44;

const BuildPage: React.FC<BuildPageProps> = ({
  selectedVenue,
  onBack,
  onFinish,
}) => {
  const [phase, setPhase] = useState<BuildPhase>("site-selection");
  const [selectedSite, setSelectedSite] = useState<CandidateSite | null>(null);
  const [nearbyBuildings, setNearbyBuildings] = useState<MapBuilding[]>([]);
  const [draggedItemId, setDraggedItemId] = useState<BuildItemId | null>(null);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

  const venueProfile = useMemo<VenueMapProfile>(() => {
    if (!selectedVenue) return "downtown";
    if (selectedVenue.id === "riverside-park") return "riverside";
    if (selectedVenue.id === "edge-district-lot") return "edge-district";
    return "downtown";
  }, [selectedVenue]);

  const totalBudget = selectedVenue?.budget ?? 0;

  const usedBudget = placedItems.reduce((sum, placed) => {
    return sum + BUILD_ITEM_MAP[placed.itemId].cost;
  }, 0);

  const remainingBudget = totalBudget - usedBudget;
const stagePlaced = placedItems.some((item) => item.itemId === "stage");

const speakerPlaced = placedItems.some((item) =>
  item.itemId === "standard-speaker" ||
  item.itemId === "directional-speaker" ||
  item.itemId === "eco-speaker"
);

const safeLimit = Number(selectedSite?.maxAllowedDb?.toFixed(1) ?? 0);

const calculateMockScore = () => {
  const budgetEfficiency =
    totalBudget > 0 ? Math.max(0, 100 - (usedBudget / totalBudget) * 100) : 0;

  const speakerCount = placedItems.filter(
    (item) =>
      item.itemId === "standard-speaker" ||
      item.itemId === "directional-speaker" ||
      item.itemId === "eco-speaker"
  ).length;

  const barrierCount = placedItems.filter(
    (item) =>
      item.itemId === "basic-barrier" || item.itemId === "premium-wall"
  ).length;

  const stageBonus = stagePlaced ? 20 : 0;
  const speakerBonus = Math.min(speakerCount * 12, 36);
  const barrierBonus = Math.min(barrierCount * 10, 30);
  const safeBonus = Math.min(safeLimit / 2, 50);

  const score = Math.round(
    stageBonus + speakerBonus + barrierBonus + safeBonus + budgetEfficiency * 0.2
  );

  return Math.min(score, 100);
};

const canContinueToNextStep = stagePlaced && speakerPlaced;

  const canPlaceItemAt = (itemId: BuildItemId, col: number, row: number) => {
    const def = BUILD_ITEM_MAP[itemId];

    if (col + def.width > GRID_COLUMNS) return false;
    if (row + def.height > GRID_ROWS) return false;

    if (def.unique) {
      const alreadyPlaced = placedItems.some((p) => p.itemId === itemId);
      if (alreadyPlaced) return false;
    }

    if (remainingBudget < def.cost) return false;

    for (const placed of placedItems) {
      const existing = BUILD_ITEM_MAP[placed.itemId];

      const overlap =
        col < placed.col + existing.width &&
        col + def.width > placed.col &&
        row < placed.row + existing.height &&
        row + def.height > placed.row;

      if (overlap) return false;
    }

    return true;
  };

  const handlePlaceItem = (itemId: BuildItemId, col: number, row: number) => {
    if (!canPlaceItemAt(itemId, col, row)) {
      alert("This item cannot be placed here.");
      return;
    }

    const newItem: PlacedItem = {
      uid: `${itemId}-${Date.now()}-${Math.random()}`,
      itemId,
      col,
      row,
    };

    setPlacedItems((prev) => [...prev, newItem]);
  };

  if (!selectedVenue) {
    return (
      <div className="build-page">
        <div className="build-shell">
          <h1>No venue selected.</h1>
          <button className="pixel-secondary-btn" onClick={onBack}>
            BACK TO VENUES
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="build-page">
      {phase === "site-selection" && (
        <>
          <MapCanvas
            venueProfile={venueProfile}
            selectedSite={selectedSite}
            mode="site-selection"
            selectedTool={null}
            onSiteSelected={setSelectedSite}
            onNearbyBuildingsChange={setNearbyBuildings}
          />

          <div className="build-top-info">
            <div className="build-venue-card">
              <p className="build-step-tag">STEP 2</p>
              <h1>SELECT YOUR CONCERT SPOT</h1>
              <h2>{selectedVenue.name}</h2>
              <p>{selectedVenue.description}</p>

              <div className="build-meta">
                <span>Capacity: {selectedVenue.capacity}</span>
                <span>Budget: ${selectedVenue.budget}</span>
                <span>Difficulty: {selectedVenue.difficulty}</span>
              </div>
            </div>
          </div>

          <div className="build-bottom-actions">
            <button className="pixel-secondary-btn" onClick={onBack}>
              BACK TO VENUES
            </button>

            <button
              className="pixel-primary-btn"
              disabled={!selectedSite}
              onClick={() => setPhase("layout-building")}
            >
              SELECT THIS SPOT
            </button>
          </div>
        </>
      )}

      {phase === "layout-building" && (
        <div className="layout-setup-page">
          <div className="layout-setup-grid layout-setup-grid-full">
            <aside className="layout-left-panel">
              <h3>NEARBY BUILDINGS</h3>

              <div className="nearby-building-list">
                {nearbyBuildings.length === 0 ? (
                  <p className="layout-empty-text">No nearby buildings detected.</p>
                ) : (
                  nearbyBuildings.slice(0, 12).map((building) => {
                    const dist = selectedSite
                      ? Math.round(
                          Math.hypot(
                            building.centerX - selectedSite.x,
                            building.centerY - selectedSite.y
                          )
                        )
                      : 0;

                    return (
                      <div className="nearby-building-card" key={building.id}>
                        <div className="nearby-building-name">{building.type}</div>
                        <div className="nearby-building-db">
                          Tolerance: {building.db} dB
                        </div>
                        <div className="nearby-building-distance">
                          Distance to center: {dist} m
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            <main className="layout-center-panel layout-center-panel-full">
              <LayoutGrid
                columns={GRID_COLUMNS}
                rows={GRID_ROWS}
                cellSize={CELL_SIZE}
                placedItems={placedItems}
                remainingBudget={remainingBudget}
                draggedItemId={draggedItemId}
                canPlaceItemAt={canPlaceItemAt}
                onPlaceItem={handlePlaceItem}
              />
            </main>

            <aside className="layout-right-panel-static">
              <h3>ITEMS</h3>

              <div className="layout-budget-box">
                <div><b>Total:</b> ${totalBudget}</div>
                <div><b>Used:</b> ${usedBudget}</div>
                <div><b>Left:</b> ${remainingBudget}</div>
              </div>
              <div className="layout-rules-box">
  <div>
    <b>Stage:</b> {stagePlaced ? "Placed" : "Required (1 free)"}
  </div>
  <div>
    <b>Speaker:</b> {speakerPlaced ? "Placed" : "At least 1 required"}
  </div>
</div>

              <div className="layout-item-list">
                {BUILD_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className={`layout-item-card draggable-item ${
                      draggedItemId === item.id ? "active" : ""
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", item.id);
                      setDraggedItemId(item.id);
                    }}
                    onDragEnd={() => {
                      setDraggedItemId(null);
                    }}
                  >
                    <div className="layout-item-top">
                      <span className="layout-item-name">{item.name}</span>
                      <span className="layout-item-cost">${item.cost}</span>
                    </div>

                    <div className="layout-item-asset-preview">
                      {item.icon ? (
                        <img
                          src={item.icon}
                          alt={item.name}
                          className="layout-item-icon"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : null}
                    </div>

                    <p>{item.description}</p>
                    <div className="layout-item-size">
                      Size: {item.width}x{item.height}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          <div className="layout-static-bottom-actions">
            <button
              className="pixel-secondary-btn"
              onClick={() => setPhase("site-selection")}
            >
              BACK TO MAP
            </button>

            <button
  className="pixel-primary-btn"
  disabled={!canContinueToNextStep}
  onClick={() => {
    if (!stagePlaced) {
      alert("You must place exactly one Concert Stage.");
      return;
    }

    if (!speakerPlaced) {
      alert("You must place at least one speaker.");
      return;
    }

    const finalScore = calculateMockScore();

    onFinish({
      finalScore,
      safeLimit,
      usedBudget,
      totalBudget,
    });
  }}
>
  CONTINUE
</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildPage;