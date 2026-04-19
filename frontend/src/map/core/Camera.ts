import { CONFIG } from "./config";
import type { WorldPoint } from "../types/map";

export class Camera {
  zoom: number;
  x: number;
  y: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.zoom = 0.4;
    this.x = canvasWidth / 2 - (CONFIG.GRID_SIZE * this.zoom) / 2;
    this.y = canvasHeight / 2 - (CONFIG.GRID_SIZE * this.zoom) / 2;
  }

  pan(dx: number, dy: number) {
    this.x += dx;
    this.y += dy;
  }

  handleZoom(deltaY: number, mouseX: number, mouseY: number) {
    const zoomFactor = -deltaY * 0.002;
    let newZoom = this.zoom * Math.exp(zoomFactor);
    newZoom = Math.max(0.15, Math.min(newZoom, 40));

    const worldX = (mouseX - this.x) / this.zoom;
    const worldY = (mouseY - this.y) / this.zoom;

    this.x = mouseX - worldX * newZoom;
    this.y = mouseY - worldY * newZoom;
    this.zoom = newZoom;
  }

  screenToWorld(screenX: number, screenY: number): WorldPoint {
    return {
      x: Math.floor((screenX - this.x) / this.zoom),
      y: Math.floor((screenY - this.y) / this.zoom),
    };
  }
}