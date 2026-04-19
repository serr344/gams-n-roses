import type { MapBuilding, OptimPreviewData } from "../types/map";

type CityLike = {
  buildings: MapBuilding[];
};

export function runOptimizationPreview(
  cityModel: CityLike,
  wx: number,
  wy: number,
  radius: number
): OptimPreviewData {
  const nearby = [];

  for (const b of cityModel.buildings) {
    const d = Math.hypot(b.centerX - wx, b.centerY - wy);

    if (d > 1 && d <= radius) {
      nearby.push({
        type: b.type,
        dbLimit: b.db,
        dist: d,
        allowed: b.db + 20 * Math.log10(d),
        centerX: b.centerX,
        centerY: b.centerY,
      });
    }
  }

  if (nearby.length === 0) {
    return {
      maxDb: 130,
      status: "no_constraints",
      nearby: [],
      limitingBuilding: null,
    };
  }

  let limiting = nearby[0];

  for (const b of nearby) {
    if (b.allowed < limiting.allowed) {
      limiting = b;
    }
  }

  return {
    maxDb: Math.round(limiting.allowed * 10) / 10,
    status: "optimal",
    nearby,
    limitingBuilding: limiting,
  };
}