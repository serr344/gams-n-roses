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

type MapCanvasProps = {
  venueProfile: VenueMapProfile;
  onSiteSelected: (site: CandidateSite) => void;
  selectedSite: CandidateSite | null;
};

const MapCanvas: React.FC<MapCanvasProps> = ({
  venueProfile,
  onSiteSelected,
  selectedSite,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cityModelRef = useRef<CityModel | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const selectedSiteRef = useRef<CandidateSite | null>(null);
  const hoveredBuildingRef = useRef<MapBuilding | null>(null);
  const optimPreviewRef = useRef<OptimPreviewState>(null);

  const [hoverInfo, setHoverInfo] = useState<HoverInfo>({
    building: null,
    mouseX: 0,
    mouseY: 0,
    worldPos: null,
  });

  const [, forceUiRefresh] = useState(0);

  useEffect(() => {
    selectedSiteRef.current = selectedSite;
  }, [selectedSite]);

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
    forceUiRefresh((v) => v + 1);
  }, [selectedSite]);

  return (
    <div className="map-canvas-shell">
      <canvas ref={canvasRef} className="map-canvas" />

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

      {hoverInfo.building && (
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