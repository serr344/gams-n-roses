import { CONFIG } from './config.js';

export class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.zoom = 0.4; // Haritanın tamamı görünsün diye küçük başlangıç
        this.x = canvasWidth / 2 - (CONFIG.GRID_SIZE * this.zoom) / 2;
        this.y = canvasHeight / 2 - (CONFIG.GRID_SIZE * this.zoom) / 2;
    }

    pan(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    handleZoom(deltaY, mouseX, mouseY) {
        let zoomFactor = -deltaY * 0.002;
        let newZoom = this.zoom * Math.exp(zoomFactor);
        newZoom = Math.max(0.15, Math.min(newZoom, 40)); // 0.15'e kadar uzaklaşabilir

        let worldX = (mouseX - this.x) / this.zoom;
        let worldY = (mouseY - this.y) / this.zoom;

        this.x = mouseX - worldX * newZoom;
        this.y = mouseY - worldY * newZoom;
        this.zoom = newZoom;
    }

    screenToWorld(screenX, screenY) {
        return {
            x: Math.floor((screenX - this.x) / this.zoom),
            y: Math.floor((screenY - this.y) / this.zoom)
        };
    }
}