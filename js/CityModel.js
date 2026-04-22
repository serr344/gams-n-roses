import { CONFIG } from './config.js';

export class CityModel {
    constructor() {
        this.grid = new Array(CONFIG.GRID_SIZE).fill(null)
            .map(() => new Array(CONFIG.GRID_SIZE).fill(null));
        this.buildings = [];
        this.roads = [];
        this.roadGrid = new Array(CONFIG.GRID_SIZE).fill(false)
            .map(() => new Array(CONFIG.GRID_SIZE).fill(false));

        const GS = CONFIG.GRID_SIZE;
        const center = Math.floor(GS / 2);

        this.reservedZones = [];
        const numReservedZones = 6 + Math.floor(Math.random() * 7); 
        
        for (let i = 0; i < numReservedZones; i++) {
            const w = 300 + Math.floor(Math.random() * 800);
            const h = 300 + Math.floor(Math.random() * 800);
            const x = Math.floor(Math.random() * (CONFIG.GRID_SIZE - w));
            const y = Math.floor(Math.random() * (CONFIG.GRID_SIZE - h));
            this.reservedZones.push({ x, y, w, h });
        }

        this.generateRoads();
        this.generateCity();
    }

    generateRoads() {
        let branches = [];

        const addRoad = (x, y, w, h, isHoriz) => {
            x = Math.floor(x); y = Math.floor(y);
            w = Math.max(1, Math.floor(w)); h = Math.max(1, Math.floor(h));
            this.roads.push({ x, y, w, h, isHoriz });
            for (let i = x; i < x + w; i++) {
                for (let j = y; j < y + h; j++) {
                    if (i >= 0 && i < CONFIG.GRID_SIZE && j >= 0 && j < CONFIG.GRID_SIZE) {
                        this.roadGrid[i][j] = true;
                    }
                }
            }
            branches.push({ x, y, w, h, isHoriz });
        };

        const GS = CONFIG.GRID_SIZE;
        const center = Math.floor(GS / 2);

        const addRadialArtery = (endX, endY) => {
            let cx = center; let cy = center;
            const steps = 13;
            const thick = 22 + Math.floor(Math.random() * 6);
            for (let s = 0; s < steps; s++) {
                const targetX = Math.floor(center + (endX - center) * (s + 1) / steps + (Math.random() - 0.5) * 300);
                const targetY = Math.floor(center + (endY - center) * (s + 1) / steps + (Math.random() - 0.5) * 300);

                if (Math.abs(targetX - cx) > Math.abs(targetY - cy)) {
                    const rw = targetX - cx;
                    if (Math.abs(rw) > 0) {
                        addRoad(rw > 0 ? cx : cx + rw, cy - Math.floor(thick / 2), Math.abs(rw), thick, true);
                    }
                    cx = targetX;
                } else {
                    const rh = targetY - cy;
                    if (Math.abs(rh) > 0) {
                        addRoad(cx - Math.floor(thick / 2), rh > 0 ? cy : cy + rh, thick, Math.abs(rh), false);
                    }
                    cy = targetY;
                }
            }
        };

        addRadialArtery(100, 100);
        addRadialArtery(GS - 100, 100);
        addRadialArtery(100, GS - 100);
        addRadialArtery(GS - 100, GS - 100);

        for (let a = 0; a < 3; a++) {
            const isH = Math.random() > 0.5;
            const offset = Math.floor((Math.random() - 0.5) * GS * 0.7);
            const thick = 14 + Math.floor(Math.random() * 8);
            const segCount = 5 + Math.floor(Math.random() * 4);

            if (isH) {
                let ay = center + offset; ay = Math.max(80, Math.min(GS - 80, ay));
                const sw = Math.floor(GS / segCount);
                for (let s = 0; s < segCount; s++) {
                    const x = s * sw; const w = s === segCount - 1 ? GS - x : sw + 10;
                    addRoad(x, ay, w, thick, true);
                    ay += Math.floor((Math.random() - 0.5) * 150); ay = Math.max(80, Math.min(GS - 80, ay));
                }
            } else {
                let ax = center + offset; ax = Math.max(80, Math.min(GS - 80, ax));
                const sh = Math.floor(GS / segCount);
                for (let s = 0; s < segCount; s++) {
                    const y = s * sh; const h = s === segCount - 1 ? GS - y : sh + 10;
                    addRoad(ax, y, thick, h, false);
                    ax += Math.floor((Math.random() - 0.5) * 150); ax = Math.max(80, Math.min(GS - 80, ax));
                }
            }
        }

        for (let i = 0; i < 4050; i++) {
            let parent = branches[Math.floor(Math.random() * branches.length)];
            let targetLength = Math.floor(Math.random() * 700) + 200;
            let dir = Math.random() > 0.5 ? 1 : -1;
            let roadThick = 10;
            let gap = 160;
            let startX, startY, actualLength = 0;

            if (parent.isHoriz && parent.w <= roadThick) continue;
            if (!parent.isHoriz && parent.h <= roadThick) continue;

            if (parent.isHoriz) {
                startX = parent.x + Math.floor(Math.random() * ((parent.w - roadThick) / 10)) * 10;
                startY = dir === 1 ? parent.y + parent.h : parent.y - roadThick;

                while (actualLength < targetLength) {
                    let checkY = dir === 1 ? startY + actualLength : startY - actualLength;
                    let checkX = startX + (Math.random() - 0.5) * actualLength * 0.08;

                    if (checkY < 0 || checkY + roadThick >= GS || checkX < 0 || checkX + roadThick >= GS) break;
                    let collision = false;
                    for (let dx = -gap; dx < roadThick + gap; dx += 8) {
                        let nx = Math.floor(checkX + dx);
                        if (nx >= 0 && nx < GS && this.roadGrid[nx][Math.floor(checkY)]) {
                            collision = true; break;
                        }
                    }
                    if (collision) break;
                    actualLength += 5;
                }
                if (actualLength >= 120) {
                    addRoad(
                        startX + (Math.random() - 0.5) * actualLength * 0.08,
                        dir === 1 ? startY : startY - actualLength + roadThick,
                        roadThick, actualLength, false
                    );
                }
            } else {
                startX = dir === 1 ? parent.x + parent.w : parent.x - roadThick;
                startY = parent.y + Math.floor(Math.random() * ((parent.h - roadThick) / 10)) * 10;

                while (actualLength < targetLength) {
                    let checkX = dir === 1 ? startX + actualLength : startX - actualLength;
                    let checkY = startY + (Math.random() - 0.5) * actualLength * 0.08;

                    if (checkX < 0 || checkX + roadThick >= GS || checkY < 0 || checkY + roadThick >= GS) break;
                    let collision = false;
                    for (let dy = -gap; dy < roadThick + gap; dy += 8) {
                        let ny = Math.floor(checkY + dy);
                        if (ny >= 0 && ny < GS && this.roadGrid[Math.floor(checkX)][ny]) {
                            collision = true; break;
                        }
                    }
                    if (collision) break;
                    actualLength += 5;
                }
                if (actualLength >= 120) {
                    addRoad(
                        dir === 1 ? startX : startX - actualLength + roadThick,
                        startY + (Math.random() - 0.5) * actualLength * 0.08,
                        actualLength, roadThick, true
                    );
                }
            }
        }
    }

    generateCity() {
        const GS = CONFIG.GRID_SIZE;
        const center = Math.floor(GS / 2);

        const parkType = CONFIG.BUILDING_TYPES.find(b => b.type === 'Merkezi Park');
        if (parkType) {
            let placed = false;
            for (let attempt = 0; attempt < 2000 && !placed; attempt++) {
                const px = Math.floor(Math.random() * (GS - parkType.w - 20)) + 10;
                const py = Math.floor(Math.random() * (GS - parkType.h - 20)) + 10;
                
                if (this.isClearForPark(px, py, parkType.w, parkType.h)) {
                    this.placeBuilding(px, py, parkType);
                    placed = true;
                }
            }
        }

        const centralGovTypes = ['Belediye Binası', 'Hükümet Binası', 'Adliye'];
        const centralRadius = 800;

        for (const typeName of centralGovTypes) {
            const bType = CONFIG.BUILDING_TYPES.find(b => b.type === typeName);
            if (!bType) continue;
            let placedCount = 0;
            let attempts = 0;
            while (placedCount < bType.maxCount && attempts < 8000) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.sqrt(Math.random()) * centralRadius;
                const x = Math.floor(center + Math.cos(angle) * radius - bType.w / 2);
                const y = Math.floor(center + Math.sin(angle) * radius - bType.h / 2);
                if (this.canPlace(x, y, bType.w, bType.h, bType)) {
                    this.placeBuilding(x, y, bType);
                    placedCount++;
                }
                attempts++;
            }
        }

        const specialBuildings = CONFIG.BUILDING_TYPES.filter(b =>
            b.maxCount !== Infinity &&
            b.type !== 'boşluk' &&
            b.type !== 'Merkezi Park' &&
            !b.isFiller &&
            !centralGovTypes.includes(b.type)
        );
        for (let bType of specialBuildings) {
            let placedCount = 0;
            let attempts = 0;
            while (placedCount < bType.maxCount && attempts < 5000) {
                let x = Math.floor(Math.random() * (GS - bType.w - 2)) + 1;
                let y = Math.floor(Math.random() * (GS - bType.h - 2)) + 1;
                if (this.canPlace(x, y, bType.w, bType.h, bType)) {
                    this.placeBuilding(x, y, bType);
                    placedCount++;
                }
                attempts++;
            }
        }

        const fillerBuildings = CONFIG.BUILDING_TYPES.filter(b =>
            (b.maxCount === Infinity || b.isFiller) && b.type !== 'boşluk'
        );
        this.fillRoadEdges(fillerBuildings);

        this.pruneEmptyRoads();
    }

    pruneEmptyRoads() {
        let newRoads = [];

        for (let r of this.roads) {
            let hasBuildingNeighbor = false;

            if (r.isHoriz) {
                for (let x = r.x; x < r.x + r.w && !hasBuildingNeighbor; x++) {
                    if (r.y > 0 && this.grid[x]?.[r.y - 1] !== null) hasBuildingNeighbor = true;
                    if (r.y + r.h < CONFIG.GRID_SIZE && this.grid[x]?.[r.y + r.h] !== null) hasBuildingNeighbor = true;
                }
            } else {
                for (let y = r.y; y < r.y + r.h && !hasBuildingNeighbor; y++) {
                    if (r.x > 0 && this.grid[r.x - 1]?.[y] !== null) hasBuildingNeighbor = true;
                    if (r.x + r.w < CONFIG.GRID_SIZE && this.grid[r.x + r.w]?.[y] !== null) hasBuildingNeighbor = true;
                }
            }

            if (hasBuildingNeighbor) {
                newRoads.push(r);
            }
        }

        this.roads = newRoads;

        for (let i = 0; i < CONFIG.GRID_SIZE; i++) {
            this.roadGrid[i].fill(false);
        }
        for (let r of this.roads) {
            for (let i = r.x; i < r.x + r.w; i++) {
                for (let j = r.y; j < r.y + r.h; j++) {
                    if (i >= 0 && i < CONFIG.GRID_SIZE && j >= 0 && j < CONFIG.GRID_SIZE) {
                        this.roadGrid[i][j] = true;
                    }
                }
            }
        }
    }

    isClearForPark(x, y, w, h) {
        for (let i = x; i < x + w; i++) {
            for (let j = y; j < y + h; j++) {
                if (this.grid[i]?.[j] !== null || this.roadGrid[i]?.[j]) return false;
            }
        }
        return true;
    }

    fillRoadEdges(fillerBuildings) {
        for (let r of this.roads) {
            if (r.isHoriz) {
                let cx = r.x;
                while (cx < r.x + r.w) {
                    let checkY = r.y - 1;
                    if (cx >= CONFIG.GRID_SIZE || checkY < 0 || this.grid[cx]?.[checkY] !== null || this.roadGrid[cx]?.[checkY]) {
                        cx += 4; continue;
                    }
                    let bType = this.getRandomFillerType(fillerBuildings);
                    if (bType && this.canPlace(cx, r.y - bType.h, bType.w, bType.h, bType)) {
                        this.placeBuilding(cx, r.y - bType.h, bType);
                        cx += bType.w;
                    } else {
                        cx += 4;
                    }
                }
                cx = r.x;
                while (cx < r.x + r.w) {
                    let checkY = r.y + r.h + 1;
                    if (cx >= CONFIG.GRID_SIZE || checkY >= CONFIG.GRID_SIZE || this.grid[cx]?.[checkY] !== null || this.roadGrid[cx]?.[checkY]) {
                        cx += 4; continue;
                    }
                    let bType = this.getRandomFillerType(fillerBuildings);
                    if (bType && this.canPlace(cx, r.y + r.h, bType.w, bType.h, bType)) {
                        this.placeBuilding(cx, r.y + r.h, bType);
                        cx += bType.w;
                    } else {
                        cx += 4;
                    }
                }
            } else {
                let cy = r.y;
                while (cy < r.y + r.h) {
                    let checkX = r.x - 1;
                    if (cy >= CONFIG.GRID_SIZE || checkX < 0 || this.grid[checkX]?.[cy] !== null || this.roadGrid[checkX]?.[cy]) {
                        cy += 4; continue;
                    }
                    let bType = this.getRandomFillerType(fillerBuildings);
                    if (bType && this.canPlace(r.x - bType.w, cy, bType.w, bType.h, bType)) {
                        this.placeBuilding(r.x - bType.w, cy, bType);
                        cy += bType.h;
                    } else {
                        cy += 4;
                    }
                }
                cy = r.y;
                while (cy < r.y + r.h) {
                    let checkX = r.x + r.w + 1;
                    if (cy >= CONFIG.GRID_SIZE || checkX >= CONFIG.GRID_SIZE || this.grid[checkX]?.[cy] !== null || this.roadGrid[checkX]?.[cy]) {
                        cy += 4; continue;
                    }
                    let bType = this.getRandomFillerType(fillerBuildings);
                    if (bType && this.canPlace(r.x + r.w, cy, bType.w, bType.h, bType)) {
                        this.placeBuilding(r.x + r.w, cy, bType);
                        cy += bType.h;
                    } else {
                        cy += 4;
                    }
                }
            }
        }
    }

    canPlace(startX, startY, w, h, bType) {
        if (bType?.type !== 'Merkezi Park') {
            for (let zone of this.reservedZones) {
                if (startX < zone.x + zone.w && startX + w > zone.x &&
                    startY < zone.y + zone.h && startY + h > zone.y) {
                    return false;
                }
            }
        }

        if (startX < 1 || startY < 1 || startX + w >= CONFIG.GRID_SIZE - 1 || startY + h >= CONFIG.GRID_SIZE - 1) return false;

        for (let i = startX; i < startX + w; i += 4) {
            for (let j = startY; j < startY + h; j += 4) {
                if (this.roadGrid[i]?.[j] || this.grid[i]?.[j] !== null) return false;
            }
        }
        if (this.roadGrid[startX]?.[startY] || this.grid[startX]?.[startY] !== null) return false;
        if (this.roadGrid[startX + w - 1]?.[startY] || this.grid[startX + w - 1]?.[startY] !== null) return false;
        if (this.roadGrid[startX]?.[startY + h - 1] || this.grid[startX]?.[startY + h - 1] !== null) return false;
        if (this.roadGrid[startX + w - 1]?.[startY + h - 1] || this.grid[startX + w - 1]?.[startY + h - 1] !== null) return false;

        let adjacent = false;
        for (let i = startX; i < startX + w; i += 4) {
            if (this.roadGrid[i]?.[startY - 1]) { adjacent = true; break; }
            if (this.roadGrid[i]?.[startY + h]) { adjacent = true; break; }
        }
        if (!adjacent) {
            for (let j = startY; j < startY + h; j += 4) {
                if (this.roadGrid[startX - 1]?.[j]) { adjacent = true; break; }
                if (this.roadGrid[startX + w]?.[j]) { adjacent = true; break; }
            }
        }
        if (!adjacent) return false;

        if (bType && bType.minDist > 0 && bType.maxCount !== Infinity && !bType.isFiller) {
            let cx = startX + w / 2; let cy = startY + h / 2;
            for (let existing of this.buildings) {
                if (existing.type === bType.type) {
                    if (Math.hypot(cx - existing.centerX, cy - existing.centerY) < bType.minDist) return false;
                }
            }
        }
        return true;
    }

    getRandomFillerType(fillerArray) {
        const total = fillerArray.reduce((s, t) => s + t.prob, 0);
        const r = Math.random() * total;
        let cumulative = 0;
        for (let t of fillerArray) {
            cumulative += t.prob;
            if (r <= cumulative) return t;
        }
        return fillerArray[0];
    }

    placeBuilding(x, y, bType) {
        let imgObj = null;
        if (bType.imgIcon) {
            imgObj = new Image();
            imgObj.onerror = () => console.warn("İkon yüklenemedi:", CONFIG.ASSET_PATH + bType.imgIcon);
            imgObj.src = CONFIG.ASSET_PATH + bType.imgIcon;
        }
        let building = {
            id: this.buildings.length + 1,
            type: bType.type, dbLimit: bType.db, color: bType.color,
            x: x, y: y, w: bType.w, h: bType.h,
            centerX: x + bType.w / 2, centerY: y + bType.h / 2,
            imageObj: imgObj
        };
        this.buildings.push(building);

        for (let i = x; i < x + bType.w; i++) {
            for (let j = y; j < y + bType.h; j++) {
                this.grid[i][j] = building;
            }
        }
    }

    getBuildingAt(x, y) {
        if (x >= 0 && x < CONFIG.GRID_SIZE && y >= 0 && y < CONFIG.GRID_SIZE) return this.grid[x][y];
        return null;
    }
    isRoad(x, y) {
        if (x >= 0 && x < CONFIG.GRID_SIZE && y >= 0 && y < CONFIG.GRID_SIZE) {
            return !!this.roadGrid[x]?.[y];
        }
        return false;
    }

}