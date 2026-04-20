export class InputManager {
    constructor(canvas, camera, cityModel, uiCallback, drawCallback) {
        this.canvas = canvas;
        this.camera = camera;
        this.cityModel = cityModel;
        this.uiCallback = uiCallback;
        this.drawCallback = drawCallback;

        this.isDragging = false;
        this.hasDragged = false;
        this.lastMousePos = { x: 0, y: 0 };

        this.initEvents();
    }

    initEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.hasDragged = false;
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.hasDragged = true;
                let dx = e.clientX - this.lastMousePos.x;
                let dy = e.clientY - this.lastMousePos.y;
                this.camera.pan(dx, dy);
                this.lastMousePos = { x: e.clientX, y: e.clientY };
                this.drawCallback();
            }

            let worldPos = this.camera.screenToWorld(e.clientX, e.clientY);
            let building = this.cityModel.getBuildingAt(worldPos.x, worldPos.y);

            if (!building && worldPos.x >= 0 && worldPos.x < 300 && worldPos.y >= 0 && worldPos.y < 300) {
                let isRoad = this.cityModel.roadGrid[worldPos.x]?.[worldPos.y];
                if (!isRoad) {
                    building = { type: "Doğal Park Alanı", db: 0, centerX: worldPos.x, centerY: worldPos.y };
                }
            }

            // worldPos da callback'e gönderiliyor — optimizasyon için
            this.uiCallback('hover', building, e.clientX, e.clientY, this.isDragging, worldPos);
        });

        this.canvas.addEventListener('mouseup', () => { this.isDragging = false; });
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.uiCallback('leave', null, 0, 0, false, null);
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.handleZoom(e.deltaY, e.clientX, e.clientY);
            this.drawCallback();
        }, { passive: false });

this.canvas.addEventListener('click', (e) => {
    if (this.hasDragged) return;
    let worldPos = this.camera.screenToWorld(e.clientX, e.clientY);
    let building = this.cityModel.getBuildingAt(worldPos.x, worldPos.y);
    this.uiCallback('click', building, e.clientX, e.clientY, false, worldPos); // ← her tıklamada, worldPos ile
    this.drawCallback();
});
    }
}