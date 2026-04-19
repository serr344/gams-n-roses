import { CONFIG } from "./config";
import type {
  BuildingTypeConfig,
  MapBuilding,
  RoadRect,
  VenueMapProfile,
} from "../types/map";

export class CityModel {
  grid: (MapBuilding | null)[][];
  buildings: MapBuilding[];
  roads: RoadRect[];
  roadGrid: boolean[][];
  venueProfile: VenueMapProfile;

  constructor(venueProfile: VenueMapProfile = "downtown") {
    this.venueProfile = venueProfile;

    this.grid = new Array(CONFIG.GRID_SIZE)
      .fill(null)
      .map(() => new Array(CONFIG.GRID_SIZE).fill(null));

    this.buildings = [];
    this.roads = [];

    this.roadGrid = new Array(CONFIG.GRID_SIZE)
      .fill(false)
      .map(() => new Array(CONFIG.GRID_SIZE).fill(false));

    this.generateRoads();
    this.generateCity();
  }

  generateRoads() {
    const branches: Array<{
      x: number;
      y: number;
      w: number;
      h: number;
      isHoriz: boolean;
    }> = [];

    const addRoad = (
      x: number,
      y: number,
      w: number,
      h: number,
      isHoriz: boolean
    ) => {
      this.roads.push({ x, y, w, h });

      for (let i = x; i < x + w; i++) {
        for (let j = y; j < y + h; j++) {
          if (
            i >= 0 &&
            i < CONFIG.GRID_SIZE &&
            j >= 0 &&
            j < CONFIG.GRID_SIZE
          ) {
            this.roadGrid[i][j] = true;
          }
        }
      }

      branches.push({ x, y, w, h, isHoriz });
    };

    const center = Math.floor(CONFIG.GRID_SIZE / 2);

    addRoad(0, center - 10, CONFIG.GRID_SIZE, 20, true);
    addRoad(center - 10, 0, 20, CONFIG.GRID_SIZE, false);

    for (let i = 0; i < 1400; i++) {
      const parent = branches[Math.floor(Math.random() * branches.length)];
      const targetLength = Math.floor(Math.random() * 400) + 100;
      const dir = Math.random() > 0.5 ? 1 : -1;
      const roadThick = 10;
      const gap = 110;

      let startX: number;
      let startY: number;
      let actualLength = 0;

      if (parent.isHoriz) {
        startX =
          parent.x +
          Math.floor(Math.random() * ((parent.w - roadThick) / 10)) * 10;
        startY = dir === 1 ? parent.y + parent.h : parent.y - roadThick;

        while (actualLength < targetLength) {
          const checkY = dir === 1 ? startY + actualLength : startY - actualLength;

          if (checkY < 0 || checkY + roadThick >= CONFIG.GRID_SIZE) break;

          let collision = false;

          for (let dx = -gap; dx < roadThick + gap; dx++) {
            const nx = startX + dx;

            if (nx >= 0 && nx < CONFIG.GRID_SIZE) {
              if (this.roadGrid[nx][checkY]) {
                collision = true;
                break;
              }
            }
          }

          if (collision) break;
          actualLength += 5;
        }

        if (actualLength >= 50) {
          const finalY = dir === 1 ? startY : startY - actualLength + roadThick;
          addRoad(startX, finalY, roadThick, actualLength, false);
        }
      } else {
        startX = dir === 1 ? parent.x + parent.w : parent.x - roadThick;
        startY =
          parent.y +
          Math.floor(Math.random() * ((parent.h - roadThick) / 10)) * 10;

        while (actualLength < targetLength) {
          const checkX = dir === 1 ? startX + actualLength : startX - actualLength;

          if (checkX < 0 || checkX + roadThick >= CONFIG.GRID_SIZE) break;

          let collision = false;

          for (let dy = -gap; dy < roadThick + gap; dy++) {
            const ny = startY + dy;

            if (ny >= 0 && ny < CONFIG.GRID_SIZE) {
              if (this.roadGrid[checkX][ny]) {
                collision = true;
                break;
              }
            }
          }

          if (collision) break;
          actualLength += 5;
        }

        if (actualLength >= 50) {
          const finalX = dir === 1 ? startX : startX - actualLength + roadThick;
          addRoad(finalX, startY, actualLength, roadThick, true);
        }
      }
    }
  }

  generateCity() {
    const venueFiltered = this.getVenueAwareBuildingTypes();
    const specialBuildings = venueFiltered.filter(
      (b) => b.maxCount !== Infinity
    );
    const fillerBuildings = venueFiltered.filter(
      (b) => b.maxCount === Infinity
    );

    for (const bType of specialBuildings) {
      let placedCount = 0;

      outer: for (
        let y = 1;
        y < CONFIG.GRID_SIZE - bType.h - 1;
        y += bType.h + 20
      ) {
        for (
          let x = 1;
          x < CONFIG.GRID_SIZE - bType.w - 1;
          x += bType.w + 20
        ) {
          if (placedCount >= bType.maxCount) break outer;

          if (this.canPlace(x, y, bType.w, bType.h, bType)) {
            this.placeBuilding(x, y, bType);
            placedCount++;
          }
        }
      }

      let attempts = 0;
      while (placedCount < bType.maxCount && attempts < 10000) {
        const x =
          Math.floor(Math.random() * (CONFIG.GRID_SIZE - bType.w - 2)) + 1;
        const y =
          Math.floor(Math.random() * (CONFIG.GRID_SIZE - bType.h - 2)) + 1;

        if (this.canPlace(x, y, bType.w, bType.h, bType)) {
          this.placeBuilding(x, y, bType);
          placedCount++;
        }

        attempts++;
      }
    }

    for (let y = 1; y < CONFIG.GRID_SIZE - 1; y += 48) {
      for (let x = 1; x < CONFIG.GRID_SIZE - 1; x += 48) {
        if (this.grid[x][y]) continue;

        let bType = this.getRandomFillerType(fillerBuildings);

        if (!this.canPlace(x, y, bType.w, bType.h, null)) {
          bType = fillerBuildings[0];
        }

        if (this.canPlace(x, y, bType.w, bType.h, null)) {
          this.placeBuilding(x, y, bType);
        }
      }
    }

    this.fillRoadEdges(fillerBuildings);
  }

  getVenueAwareBuildingTypes(): BuildingTypeConfig[] {
    const cloned = CONFIG.BUILDING_TYPES.map((b) => ({ ...b }));

    if (this.venueProfile === "riverside") {
      return cloned.map((b) => {
        if (b.type.includes("Kütüphane")) return { ...b, maxCount: 5 };
        if (b.type.includes("Apartman")) return { ...b, prob: 0.45 };
        if (b.type.includes("Müstakil Ev")) return { ...b, prob: 0.35 };
        if (b.type.includes("Fabrika")) return { ...b, maxCount: 2 };
        return b;
      });
    }

    if (this.venueProfile === "edge-district") {
      return cloned.map((b) => {
        if (b.type.includes("Otopark")) return { ...b, maxCount: 14 };
        if (b.type.includes("Fabrika")) return { ...b, maxCount: 6 };
        if (b.type.includes("Apartman")) return { ...b, prob: 0.25 };
        if (b.type.includes("Kafe")) return { ...b, prob: 0.08 };
        return b;
      });
    }

    return cloned.map((b) => {
      if (b.type.includes("Ofis")) return { ...b, maxCount: 45 };
      if (b.type.includes("AVM")) return { ...b, maxCount: 3 };
      if (b.type.includes("Rezidans")) return { ...b, maxCount: 30 };
      return b;
    });
  }

  fillRoadEdges(fillerBuildings: BuildingTypeConfig[]) {
    const sizes = [48, 64];

    const dirs = [
      { ox: 0, oy: 1 },
      { ox: 0, oy: -1 },
      { ox: 1, oy: 0 },
      { ox: -1, oy: 0 },
    ];

    for (let rx = 1; rx < CONFIG.GRID_SIZE - 1; rx += 4) {
      for (let ry = 1; ry < CONFIG.GRID_SIZE - 1; ry += 4) {
        if (!this.roadGrid[rx][ry]) continue;

        for (const d of dirs) {
          for (const size of sizes) {
            for (let offset = 0; offset < 3; offset++) {
              let bx: number;
              let by: number;

              if (d.ox !== 0) {
                bx = d.ox === 1 ? rx + 1 : rx - size;
                by = ry - Math.floor(size / 2) + offset * 16;
              } else {
                bx = rx - Math.floor(size / 2) + offset * 16;
                by = d.oy === 1 ? ry + 1 : ry - size;
              }

              if (
                bx < 1 ||
                by < 1 ||
                bx + size >= CONFIG.GRID_SIZE - 1 ||
                by + size >= CONFIG.GRID_SIZE - 1
              ) {
                continue;
              }

              if (this.grid[bx][by]) continue;

              for (const ft of fillerBuildings) {
                if (ft.w !== size && ft.h !== size) continue;

                if (this.canPlace(bx, by, ft.w, ft.h, null)) {
                  this.placeBuilding(bx, by, ft);
                  break;
                }
              }
            }
          }
        }
      }
    }
  }

  canPlace(
    startX: number,
    startY: number,
    w: number,
    h: number,
    bType: BuildingTypeConfig | null
  ) {
    if (
      startX < 1 ||
      startY < 1 ||
      startX + w >= CONFIG.GRID_SIZE - 1 ||
      startY + h >= CONFIG.GRID_SIZE - 1
    ) {
      return false;
    }

    for (let i = startX; i < startX + w; i++) {
      for (let j = startY; j < startY + h; j++) {
        if (this.roadGrid[i][j] || this.grid[i][j] !== null) {
          return false;
        }
      }
    }

    let adjacent = false;

    for (let i = startX; i < startX + w; i++) {
      if (this.roadGrid[i][startY - 1]) adjacent = true;
      if (this.roadGrid[i][startY + h]) adjacent = true;
    }

    for (let j = startY; j < startY + h; j++) {
      if (this.roadGrid[startX - 1][j]) adjacent = true;
      if (this.roadGrid[startX + w][j]) adjacent = true;
    }

    if (!adjacent) return false;

    if (bType && bType.minDist > 0) {
      const cx = startX + w / 2;
      const cy = startY + h / 2;

      for (const existing of this.buildings) {
        if (existing.type === bType.type) {
          if (
            Math.hypot(cx - existing.centerX, cy - existing.centerY) <
            bType.minDist
          ) {
            return false;
          }
        }
      }
    }

    return true;
  }

  getRandomFillerType(fillerArray: BuildingTypeConfig[]) {
    const r = Math.random();
    let cumulative = 0;

    for (const t of fillerArray) {
      cumulative += t.prob ?? 0;
      if (r <= cumulative) return t;
    }

    return fillerArray[0];
  }

  placeBuilding(x: number, y: number, bType: BuildingTypeConfig) {
    let imgObj: HTMLImageElement | null = null;

    if (bType.imgIcon) {
      imgObj = new Image();
      imgObj.onerror = () => {
        console.warn("Map asset could not load:", CONFIG.ASSET_PATH + bType.imgIcon);
      };
      imgObj.src = CONFIG.ASSET_PATH + bType.imgIcon;
    }

    const building: MapBuilding = {
      id: this.buildings.length + 1,
      type: bType.type,
      db: bType.db,
      color: bType.color,
      x,
      y,
      w: bType.w,
      h: bType.h,
      centerX: x + bType.w / 2,
      centerY: y + bType.h / 2,
      imageObj: imgObj,
    };

    this.buildings.push(building);

    for (let i = x; i < x + bType.w; i++) {
      for (let j = y; j < y + bType.h; j++) {
        this.grid[i][j] = building;
      }
    }
  }

  getBuildingAt(x: number, y: number) {
    if (x >= 0 && x < CONFIG.GRID_SIZE && y >= 0 && y < CONFIG.GRID_SIZE) {
      return this.grid[x][y];
    }

    return null;
  }

  isRoadAt(x: number, y: number) {
    return !!this.roadGrid[x]?.[y];
  }
}