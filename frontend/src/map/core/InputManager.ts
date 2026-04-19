import type {
  CandidateSite,
  HoverInfo,
  MapBuilding,
  OptimPreviewState,
} from "../types/map";
import { CONFIG } from "./config";
import { Camera } from "./Camera";
import { CityModel } from "./CityModel";
import { runOptimizationPreview } from "./optimizationPreview";
import {
  createCandidateSite,
  isSelectableEmptySite,
} from "../utils/siteSelection";

type InputCallbacks = {
  onHoverChange: (hoverInfo: HoverInfo) => void;
  onOptimPreviewChange: (preview: OptimPreviewState) => void;
  onSiteSelected: (site: CandidateSite) => void;
  onHoveredBuildingChange: (building: MapBuilding | null) => void;
  onRequestDraw: () => void;
};

export class InputManager {
  canvas: HTMLCanvasElement;
  camera: Camera;
  cityModel: CityModel;
  callbacks: InputCallbacks;

  isDragging: boolean;
  hasDragged: boolean;
  lastMousePos: { x: number; y: number };

  constructor(
    canvas: HTMLCanvasElement,
    camera: Camera,
    cityModel: CityModel,
    callbacks: InputCallbacks
  ) {
    this.canvas = canvas;
    this.camera = camera;
    this.cityModel = cityModel;
    this.callbacks = callbacks;

    this.isDragging = false;
    this.hasDragged = false;
    this.lastMousePos = { x: 0, y: 0 };

    this.initEvents();
  }

  initEvents() {
    this.canvas.addEventListener("mousedown", (e) => {
      this.isDragging = true;
      this.hasDragged = false;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
    });

    this.canvas.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        this.hasDragged = true;

        const dx = e.clientX - this.lastMousePos.x;
        const dy = e.clientY - this.lastMousePos.y;

        this.camera.pan(dx, dy);
        this.lastMousePos = { x: e.clientX, y: e.clientY };

        this.callbacks.onRequestDraw();
      }

      const worldPos = this.camera.screenToWorld(e.clientX, e.clientY);
      let building = this.cityModel.getBuildingAt(worldPos.x, worldPos.y);

      if (!building && worldPos.x >= 0 && worldPos.x < 300 && worldPos.y >= 0 && worldPos.y < 300) {
        const isRoad = this.cityModel.roadGrid[worldPos.x]?.[worldPos.y];
        if (!isRoad) {
          building = {
            id: -1,
            type: "Doğal Park Alanı",
            db: 0,
            color: "#4b8f3a",
            x: worldPos.x,
            y: worldPos.y,
            w: 1,
            h: 1,
            centerX: worldPos.x,
            centerY: worldPos.y,
            imageObj: null,
          };
        }
      }

      this.callbacks.onHoveredBuildingChange(
        !this.isDragging ? building : null
      );

      this.callbacks.onHoverChange({
        building: !this.isDragging ? building : null,
        mouseX: e.clientX,
        mouseY: e.clientY,
        worldPos,
      });

      if (!this.isDragging) {
        const previewData = runOptimizationPreview(
          this.cityModel,
          worldPos.x,
          worldPos.y,
          CONFIG.OPTIM_RADIUS
        );

        this.callbacks.onOptimPreviewChange({
          pos: { x: worldPos.x, y: worldPos.y },
          data: previewData,
        });
      }
    });

    this.canvas.addEventListener("mouseup", () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener("mouseleave", () => {
      this.isDragging = false;
      this.callbacks.onHoverChange({
        building: null,
        mouseX: 0,
        mouseY: 0,
        worldPos: null,
      });
      this.callbacks.onOptimPreviewChange(null);
      this.callbacks.onHoveredBuildingChange(null);
    });

    this.canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.camera.handleZoom(e.deltaY, e.clientX, e.clientY);
        this.callbacks.onRequestDraw();
      },
      { passive: false }
    );

this.canvas.addEventListener("click", (e) => {
  if (this.hasDragged) return;

  const worldPos = this.camera.screenToWorld(e.clientX, e.clientY);

  const building = this.cityModel.getBuildingAt(worldPos.x, worldPos.y);
  if (building) return;

  if (!isSelectableEmptySite(this.cityModel, worldPos.x, worldPos.y)) return;

  const previewData = runOptimizationPreview(
    this.cityModel,
    worldPos.x,
    worldPos.y,
    CONFIG.OPTIM_RADIUS
  );

  // Seçilen yerin kendisini sakla
  const site = createCandidateSite(
    worldPos.x,
    worldPos.y,
    previewData,
    CONFIG.OPTIM_RADIUS
  );

  console.log("Selected site:", site);

  this.callbacks.onSiteSelected(site);
  this.callbacks.onRequestDraw();
});
  }
}