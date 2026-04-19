import type { PlacedItem } from '../types/game';

export function canPlaceItem(existing: PlacedItem[], x: number, y: number): boolean {
  return !existing.some((item) => item.x === x && item.y === y);
}
