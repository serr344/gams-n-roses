export class InputManager {
    constructor(canvas, camera, cityModel, uiCallback) {
        this.canvas = canvas;
        this.camera = camera;
        this.cityModel = cityModel;
        this.uiCallback = uiCallback;

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
                const dx = e.clientX - this.lastMousePos.x;
                const dy = e.clientY - this.lastMousePos.y;
                this.camera.pan(dx, dy);
                this.lastMousePos = { x: e.clientX, y: e.clientY };
            }

            const worldPos = this.camera.screenToWorld(e.clientX, e.clientY);
            const building = this.cityModel.getBuildingAt(worldPos.x, worldPos.y);

            this.uiCallback('hover', building, e.clientX, e.clientY, this.isDragging, worldPos);
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.uiCallback('leave', null, 0, 0, false, null);
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.camera.handleZoom(e.deltaY, e.clientX, e.clientY);
        }, { passive: false });

        this.canvas.addEventListener('click', (e) => {
            if (this.hasDragged) return;

            const worldPos = this.camera.screenToWorld(e.clientX, e.clientY);
            const building = this.cityModel.getBuildingAt(worldPos.x, worldPos.y);

            this.uiCallback('click', building, e.clientX, e.clientY, false, worldPos);
        });
    }
}