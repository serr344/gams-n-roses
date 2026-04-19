import { CONFIG } from "./config";
import type {
  CandidateSite,
  MapBuilding,
  OptimPreviewState,
} from "../types/map";
import { CityModel } from "./CityModel";
import { Camera } from "./Camera";

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas 2D context could not be created.");
    }

    this.ctx = ctx;
  }

  resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  draw(
    cityModel: CityModel,
    camera: Camera,
    selectedSite: CandidateSite | null,
    optimState: OptimPreviewState = null,
    hoveredBuilding: MapBuilding | null = null
  ) {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    this.ctx.translate(camera.x, camera.y);
    this.ctx.scale(camera.zoom, camera.zoom);

    this.ctx.fillStyle = "#2d5a27";
    this.ctx.fillRect(0, 0, CONFIG.GRID_SIZE, CONFIG.GRID_SIZE);

    this.ctx.fillStyle = "#222";
    for (const r of cityModel.roads) {
      this.ctx.fillRect(r.x, r.y, r.w, r.h);
    }

    cityModel.buildings.forEach((b) => {
      if (optimState?.data?.nearby) {
        const found = optimState.data.nearby.find(
          (n) => n.centerX === b.centerX && n.centerY === b.centerY
        );

        if (found) {
          const allAllowed = optimState.data.nearby.map((x) => x.allowed);
          const minA = Math.min(...allAllowed);
          const maxA = Math.max(...allAllowed);
          const t = maxA === minA ? 0.5 : (found.allowed - minA) / (maxA - minA);
          const rr = Math.round(255 * (1 - t));
          const gg = Math.round(180 * t);
          this.ctx.fillStyle = `rgb(${rr},${gg},20)`;
          this.ctx.fillRect(b.x, b.y, b.w, b.h);
        } else {
          this.ctx.fillStyle = b.color;
          this.ctx.fillRect(b.x, b.y, b.w, b.h);
        }
      } else {
        this.ctx.fillStyle = b.color;
        this.ctx.fillRect(b.x, b.y, b.w, b.h);
      }

      if (b.imageObj && b.imageObj.complete && b.imageObj.naturalWidth !== 0) {
        const padding = 1;
        this.ctx.drawImage(
          b.imageObj,
          b.x + padding,
          b.y + padding,
          b.w - padding * 2,
          b.h - padding * 2
        );
      }

      if (hoveredBuilding && hoveredBuilding.id === b.id) {
        this.ctx.strokeStyle = "#ffffff";
        this.ctx.lineWidth = 3 / camera.zoom;
        this.ctx.strokeRect(b.x, b.y, b.w, b.h);
      }
    });

    if (optimState?.pos) {
      this.drawOptimOverlay(camera, optimState);
    }

    if (selectedSite) {
      this.drawSelectedSite(selectedSite, camera);
    }

    this.ctx.restore();

    if (optimState?.pos && optimState?.data) {
      this.drawHUD(camera, optimState);
    }
  }

  drawSelectedSite(selectedSite: CandidateSite, camera: Camera) {
    const { x, y, radius } = selectedSite;
    const ctx = this.ctx;

    ctx.strokeStyle = "rgba(80,255,180,0.95)";
    ctx.lineWidth = 4 / camera.zoom;
    ctx.setLineDash([10 / camera.zoom, 6 / camera.zoom]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

ctx.fillStyle = "rgba(80,255,180,0.95)";
ctx.beginPath();
ctx.arc(x, y, 28 / camera.zoom, 0, Math.PI * 2);
ctx.fill();

ctx.strokeStyle = "#000";
ctx.lineWidth = 3 / camera.zoom;
ctx.stroke();

// merkez artı işareti
ctx.strokeStyle = "#000";
ctx.lineWidth = 2 / camera.zoom;
ctx.beginPath();
ctx.moveTo(x - 18 / camera.zoom, y);
ctx.lineTo(x + 18 / camera.zoom, y);
ctx.stroke();

ctx.beginPath();
ctx.moveTo(x, y - 18 / camera.zoom);
ctx.lineTo(x, y + 18 / camera.zoom);
ctx.stroke();

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2 / camera.zoom;
    ctx.stroke();
  }

  drawOptimOverlay(camera: Camera, optimState: NonNullable<OptimPreviewState>) {
    const { x, y } = optimState.pos;
    const radius = CONFIG.OPTIM_RADIUS;
    const ctx = this.ctx;

    ctx.strokeStyle = "rgba(255, 200, 0, 0.7)";
    ctx.lineWidth = 3 / camera.zoom;
    ctx.setLineDash([12 / camera.zoom, 6 / camera.zoom]);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    [0.25, 0.5, 0.75].forEach((frac) => {
      ctx.strokeStyle = "rgba(255,200,0,0.15)";
      ctx.lineWidth = 1 / camera.zoom;
      ctx.beginPath();
      ctx.arc(x, y, radius * frac, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.fillStyle = "rgba(255,220,0,1)";
    ctx.beginPath();
    ctx.arc(x, y, 14 / camera.zoom, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2 / camera.zoom;
    ctx.stroke();

    if (optimState.data?.limitingBuilding) {
      const lb = optimState.data.limitingBuilding;
      ctx.strokeStyle = "rgba(255,80,80,0.8)";
      ctx.lineWidth = 2 / camera.zoom;
      ctx.setLineDash([6 / camera.zoom, 4 / camera.zoom]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(lb.centerX, lb.centerY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  drawHUD(camera: Camera, optimState: NonNullable<OptimPreviewState>) {
    const ctx = this.ctx;
    const { x, y } = optimState.pos;
    const data = optimState.data;

    const sx = x * camera.zoom + camera.x;
    const sy = y * camera.zoom + camera.y;

    const W = 255;
    const H = data.limitingBuilding ? 136 : 100;

    let bx = sx + 24;
    let by = sy - H - 16;

    if (bx + W > this.canvas.width - 10) bx = sx - W - 24;
    if (by < 10) by = sy + 24;

    ctx.fillStyle = "rgba(8, 12, 20, 0.92)";
    ctx.strokeStyle =
      data.maxDb > 100 ? "#ff4444" : data.maxDb > 80 ? "#ffaa00" : "#44ff99";
    ctx.lineWidth = 2;

    ctx.beginPath();
    if ("roundRect" in ctx) {
      ctx.roundRect(bx, by, W, H, 10);
    } else {
      ctx.rect(bx, by, W, H);
    }
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#ffcc00";
    ctx.font = "bold 13px Segoe UI";
    ctx.fillText("🎸 Site Preview", bx + 10, by + 22);

    const dbColor =
      data.maxDb > 100 ? "#ff4444" : data.maxDb > 80 ? "#ffaa00" : "#44ff99";

    ctx.fillStyle = dbColor;
    ctx.font = "bold 30px Segoe UI";
    ctx.fillText(`${data.maxDb} dB`, bx + 10, by + 62);

    ctx.fillStyle = "#888";
    ctx.font = "11px Segoe UI";
    ctx.fillText(`${data.nearby?.length ?? 0} buildings nearby`, bx + 138, by + 50);
    ctx.fillText(`r = ${CONFIG.OPTIM_RADIUS}`, bx + 138, by + 65);

    if (data.limitingBuilding) {
      ctx.strokeStyle = "rgba(255,100,100,0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bx + 10, by + 76);
      ctx.lineTo(bx + W - 10, by + 76);
      ctx.stroke();

      ctx.fillStyle = "#ff8888";
      ctx.font = "bold 11px Segoe UI";
      ctx.fillText("⚠ Limiting building:", bx + 10, by + 93);

      ctx.fillStyle = "#fff";
      ctx.font = "11px Segoe UI";

      const name =
        data.limitingBuilding.type.length > 22
          ? data.limitingBuilding.type.slice(0, 22) + "…"
          : data.limitingBuilding.type;

      ctx.fillText(name, bx + 10, by + 109);

      ctx.fillStyle = "#aaa";
      ctx.fillText(
        `${Math.round(data.limitingBuilding.dist)}m away · ${data.limitingBuilding.dbLimit} dB limit`,
        bx + 10,
        by + 125
      );
    }

    if (data.status === "no_constraints") {
      ctx.fillStyle = "#44ff99";
      ctx.font = "12px Segoe UI";
      ctx.fillText("No nearby constraints.", bx + 10, by + 88);
    }
  }
}