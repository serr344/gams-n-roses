export type BuildingTypeConfig = {
  type: string;
  w: number;
  h: number;
  db: number;
  color: string;
  maxCount: number;
  minDist: number;
  prob?: number;
  isFiller?: boolean;
  imgIcon?: string;
};

export type MapBuilding = {
  id: number;
  type: string;
  db: number;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
  centerX: number;
  centerY: number;
  imageObj?: HTMLImageElement | null;
};

export type RoadRect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type WorldPoint = {
  x: number;
  y: number;
};

export type OptimNearbyBuilding = {
  type: string;
  dbLimit: number;
  dist: number;
  allowed: number;
  centerX: number;
  centerY: number;
};

export type OptimPreviewData = {
  maxDb: number;
  status: "optimal" | "no_constraints";
  nearby: OptimNearbyBuilding[];
  limitingBuilding: OptimNearbyBuilding | null;
};

export type OptimPreviewState = {
  pos: WorldPoint;
  data: OptimPreviewData;
} | null;

export type CandidateSite = {
  x: number;
  y: number;
  radius: number;
  maxAllowedDb: number;
  limitingBuilding: OptimNearbyBuilding | null;
};

export type HoverInfo = {
  building: MapBuilding | null;
  mouseX: number;
  mouseY: number;
  worldPos: WorldPoint | null;
};

export type VenueMapProfile = "downtown" | "riverside" | "edge-district";