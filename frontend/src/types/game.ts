export interface PlacedItem {
  itemId: string;
  x: number;
  y: number;
}

export interface SimulationResult {
  userScore: number;
  optimalScore: number;
  verdict: string;
}
