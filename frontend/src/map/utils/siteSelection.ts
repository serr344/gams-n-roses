import { CONFIG } from "../core/config";
import type { CandidateSite, OptimPreviewData } from "../types/map";

type CityLike = {
  getBuildingAt: (x: number, y: number) => unknown;
  isRoadAt: (x: number, y: number) => boolean;
};

export function isSelectableEmptySite(
  cityModel: CityLike,
  x: number,
  y: number
) {
  if (x < 0 || y < 0 || x >= CONFIG.GRID_SIZE || y >= CONFIG.GRID_SIZE) {
    return false;
  }

  if (cityModel.getBuildingAt(x, y)) return false;
  if (cityModel.isRoadAt(x, y)) return false;

  return true;
}

export function createCandidateSite(
  x: number,
  y: number,
  previewData: OptimPreviewData,
  radius: number
): CandidateSite {
  return {
    x,
    y,
    radius,
    maxAllowedDb: previewData.maxDb,
    limitingBuilding: previewData.limitingBuilding,
  };
}