import type { PlacedItem } from '../types/game';

export function estimateBudgetUsage(placedItems: PlacedItem[], costs: Record<string, number>): number {
  return placedItems.reduce((sum, item) => sum + (costs[item.itemId] ?? 0), 0);
}
