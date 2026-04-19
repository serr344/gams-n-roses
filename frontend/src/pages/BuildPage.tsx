import React, { useMemo, useState } from "react";
import type { Venue } from "../App";
import MapCanvas from "../map/components/MapCanvas";
import type {
  CandidateSite,
  MapBuilding,
  VenueMapProfile,
} from "../map/types/map";

type BuildPageProps = {
  selectedVenue: Venue | null;
  onBack: () => void;
};

type BuildPhase = "site-selection" | "layout-building";

type BuildItem = {
  id: string;
  name: string;
  cost: number;
  description: string;
};

const BUILD_ITEMS: BuildItem[] = [
  {
    id: "standard-speaker",
    name: "Standard Speaker",
    cost: 200,
    description: "Balanced sound output for general audience coverage.",
  },
  {
    id: "directional-speaker",
    name: "Directional Speaker",
    cost: 300,
    description: "Focus sound toward one direction with less side leakage.",
  },
  {
    id: "eco-speaker",
    name: "Eco Speaker",
    cost: 120,
    description: "Lower noise and lower cost for sensitive areas.",
  },
  {
    id: "basic-barrier",
    name: "Basic Barrier",
    cost: 150,
    description: "Reduces sound behind the barrier.",
  },
  {
    id: "premium-wall",
    name: "Premium Acoustic Wall",
    cost: 280,
    description: "Strong protection for hospitals, libraries, and schools.",
  },
  {
    id: "smart-amplifier",
    name: "Smart Amplifier",
    cost: 260,
    description: "Improves sound efficiency while reducing wasted spillover.",
  },
];

const BuildPage: React.FC<BuildPageProps> = ({ selectedVenue, onBack }) => {
  const [phase, setPhase] = useState<BuildPhase>("site-selection");
  const [selectedSite, setSelectedSite] = useState<CandidateSite | null>(null);
  const [nearbyBuildings, setNearbyBuildings] = useState<MapBuilding[]>([]);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const venueProfile = useMemo<VenueMapProfile>(() => {
    if (!selectedVenue) return "downtown";
    if (selectedVenue.id === "riverside-park") return "riverside";
    if (selectedVenue.id === "edge-district-lot") return "edge-district";
    return "downtown";
  }, [selectedVenue]);

  if (!selectedVenue) {
    return (
      <div className="build-page">
        <div className="build-shell">
          <h1>No venue selected.</h1>
          <button className="pixel-secondary-btn" onClick={onBack}>
            BACK TO VENUES
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="build-page">
      {phase === "site-selection" && (
        <>
          <MapCanvas
            venueProfile={venueProfile}
            selectedSite={selectedSite}
            mode="site-selection"
            selectedTool={null}
            onSiteSelected={setSelectedSite}
            onNearbyBuildingsChange={setNearbyBuildings}
          />

          <div className="build-top-info">
            <div className="build-venue-card">
              <p className="build-step-tag">STEP 2</p>
              <h1>SELECT YOUR CONCERT SPOT</h1>
              <h2>{selectedVenue.name}</h2>
              <p>{selectedVenue.description}</p>

              <div className="build-meta">
                <span>Capacity: {selectedVenue.capacity}</span>
                <span>Budget: ${selectedVenue.budget}</span>
                <span>Difficulty: {selectedVenue.difficulty}</span>
              </div>
            </div>
          </div>

          <div className="build-bottom-actions">
            <button className="pixel-secondary-btn" onClick={onBack}>
              BACK TO VENUES
            </button>

            <button
              className="pixel-primary-btn"
              disabled={!selectedSite}
              onClick={() => setPhase("layout-building")}
            >
              SELECT THIS SPOT
            </button>
          </div>
        </>
      )}

      {phase === "layout-building" && (
        <div className="layout-setup-page">
          <div className="layout-setup-grid">
            <aside className="layout-left-panel">
              <h3>NEARBY BUILDINGS</h3>

              <div className="nearby-building-list">
                {nearbyBuildings.length === 0 ? (
                  <p className="layout-empty-text">No nearby buildings detected.</p>
                ) : (
                  nearbyBuildings.slice(0, 12).map((building) => {
                    const dist = selectedSite
                      ? Math.round(
                          Math.hypot(
                            building.centerX - selectedSite.x,
                            building.centerY - selectedSite.y
                          )
                        )
                      : 0;

                    return (
                      <div className="nearby-building-card" key={building.id}>
                        <div className="nearby-building-name">{building.type}</div>
                        <div className="nearby-building-db">
                          Tolerance: {building.db} dB
                        </div>
                        <div className="nearby-building-distance">
                          Distance to center: {dist} m
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            <main className="layout-center-panel">
              <div className="layout-center-placeholder">
                <h2>SELECTED CONCERT AREA</h2>
                <p>
                  This screen will be used to place speakers, barriers, and
                  support items around the selected concert center.
                </p>
                <div className="layout-center-dot" />
              </div>
            </main>

            <aside className="layout-right-panel-static">
              <h3>ITEMS</h3>

              <div className="layout-item-list">
                {BUILD_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    className={`layout-item-card ${
                      selectedTool === item.id ? "active" : ""
                    }`}
                    onClick={() => setSelectedTool(item.id)}
                  >
                    <div className="layout-item-top">
                      <span className="layout-item-name">{item.name}</span>
                      <span className="layout-item-cost">${item.cost}</span>
                    </div>
                    <p>{item.description}</p>
                  </button>
                ))}
              </div>
            </aside>
          </div>

          <div className="layout-static-bottom-actions">
            <button
              className="pixel-secondary-btn"
              onClick={() => setPhase("site-selection")}
            >
              BACK TO MAP
            </button>

            <button className="pixel-primary-btn">
              CONTINUE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildPage;