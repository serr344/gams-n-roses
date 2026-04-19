export function createEmptyHeatmap(size = 10): number[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}
