import React, { useEffect, useRef, useState } from "react";
import { Camera } from "../core/Camera";
import { CityModel } from "../core/CityModel";
import { Renderer } from "../core/Renderer";
import { InputManager } from "../core/InputManager";
import type {
  CandidateSite,
  HoverInfo,
  MapBuilding,
  OptimPreviewState,
  VenueMapProfile,
} from "../types/map";

type MapCanvasMode = "site-selection" | "layout-building";

type MapCanvasProps = {
  venueProfile: VenueMapProfile;
  onSiteSelected: (site: CandidateSite) => void;
  selectedSite: CandidateSite | null;
  mode: MapCanvasMode;
  selectedTool: string | null;
  onNearbyBuildingsChange: (buildings: MapBuilding[]) => void;
};

const LAYOUT_BUILD_ZOOM = 4.2;

const MapCanvas: React.FC<MapCanvasProps> = ({
  venueProfile,
  onSiteSelected,
  selectedSite,
  mode,
  selectedTool,
  onNearbyBuildingsChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cityModelRef = useRef<CityModel | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const selectedSiteRef = useRef<CandidateSite | null>(null);
  const hoveredBuildingRef = useRef<MapBuilding | null>(null);
  const optimPreviewRef = useRef<OptimPreviewState>(null);
  const modeRef = useRef<MapCanvasMode>("site-selection");

  const [hoverInfo, setHoverInfo] = useState<HoverInfo>({
    building: null,
    mouseX: 0,
    mouseY: 0,
    worldPos: null,
  });

  useEffect(() => {
    selectedSiteRef.current = selectedSite;
  }, [selectedSite]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cityModel = new CityModel(venueProfile);
    const camera = new Camera(window.innerWidth, window.innerHeight);
    const renderer = new Renderer(canvas);

    cityModelRef.current = cityModel;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const resize = () => {
      if (!rendererRef.current) return;
      rendererRef.current.resize(window.innerWidth, window.innerHeight);
    };

    const draw = () => {
      if (!cityModelRef.current || !cameraRef.current || !rendererRef.current) {
        return;
      }

      rendererRef.current.draw(
        cityModelRef.current,
        cameraRef.current,
        selectedSiteRef.current,
        optimPreviewRef.current,
        hoveredBuildingRef.current
      );
    };

    resize();

    const inputManager = new InputManager(canvas, camera, cityModel, {
      onHoverChange: (info) => {
        setHoverInfo(info);
      },
      onOptimPreviewChange: (preview) => {
        optimPreviewRef.current = preview;
      },
      onSiteSelected: (site) => {
        if (modeRef.current !== "site-selection") return;

        selectedSiteRef.current = site;
        onSiteSelected(site);
      },
      onHoveredBuildingChange: (building) => {
        hoveredBuildingRef.current = building;
      },
      onRequestDraw: () => {
        draw();
      },
    });

    const renderLoop = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    window.addEventListener("resize", resize);
    renderLoop();

    return () => {
      window.removeEventListener("resize", resize);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      void inputManager;
    };
  }, [venueProfile, onSiteSelected]);

useEffect(() => {
  if (
    mode === "layout-building" &&
    selectedSite &&
    cameraRef.current &&
    rendererRef.current
  ) {
    const camera = cameraRef.current;
    const canvas = rendererRef.current.canvas;

    const rightPanelWidth = 360;

    // Sağ panel hariç kalan görünür alanın merkezi
    const visibleAreaWidth = canvas.width - rightPanelWidth;
    const visibleCenterX = visibleAreaWidth / 2;
    const visibleCenterY = canvas.height / 2;

    camera.zoom = LAYOUT_BUILD_ZOOM;

    // Seçilen noktanın TAM KENDİSİ görünür merkeze gelsin
    camera.x = visibleCenterX - selectedSite.x * camera.zoom;
    camera.y = visibleCenterY - selectedSite.y * camera.zoom;
  }
}, [mode, selectedSite]);

  useEffect(() => {
    if (!cityModelRef.current || !selectedSite) {
      onNearbyBuildingsChange([]);
      return;
    }

    const nearby = cityModelRef.current.buildings.filter((b) => {
      const d = Math.hypot(b.centerX - selectedSite.x, b.centerY - selectedSite.y);
      return d <= selectedSite.radius;
    });

    nearby.sort((a, b) => {
      const da = Math.hypot(a.centerX - selectedSite.x, a.centerY - selectedSite.y);
      const db = Math.hypot(b.centerX - selectedSite.x, b.centerY - selectedSite.y);
      return da - db;
    });

    onNearbyBuildingsChange(nearby);
  }, [selectedSite, onNearbyBuildingsChange]);

  return (
    <div className={`map-canvas-shell ${mode === "layout-building" ? "layout-mode" : ""}`}>
      <canvas ref={canvasRef} className="map-canvas" />

      {mode === "site-selection" && (
        <>
          <div className="map-ui-panel">
            <h3>GAMS N&apos; Roses</h3>
            <p>🎸 <b>Step 1:</b> Choose the concert area</p>
            <p>🔍 <b>Zoom:</b> Mouse wheel</p>
            <p>🖐️ <b>Move:</b> Click and drag</p>
            <p>📍 <b>Select:</b> Click an empty area</p>
          </div>

          {selectedSite && (
            <div className="map-status-panel">
              <h3>✓ READY FOR NEXT STEP</h3>
              <p><b>Selected Point:</b> X:{selectedSite.x}, Y:{selectedSite.y}</p>
              <p><b>Max Allowed:</b> {selectedSite.maxAllowedDb} dB</p>
              <p>
                <b>Limiting Building:</b>{" "}
                {selectedSite.limitingBuilding?.type ?? "None"}
              </p>
              <p className="map-status-note">
                You can now continue to the layout-building phase.
              </p>
            </div>
          )}
        </>
      )}

      {hoverInfo.building && mode === "site-selection" && (
        <div
          className="map-tooltip"
          style={{
            left: hoverInfo.mouseX + 18,
            top: hoverInfo.mouseY + 18,
          }}
        >
          <div className="map-tooltip-title">{hoverInfo.building.type}</div>
          <div className="map-tooltip-db">
            Tolerance: {hoverInfo.building.db} dB
          </div>
          <div className="map-tooltip-coord">
            [{Math.round(hoverInfo.building.centerX)},{" "}
            {Math.round(hoverInfo.building.centerY)}]
          </div>
        </div>
      )}
    </div>
  );
};

export default MapCanvas;