import React, { useMemo, useState } from "react";
import type { Venue } from "../App";
import MapCanvas from "../map/components/MapCanvas";
import type { CandidateSite, VenueMapProfile } from "../map/types/map";

type BuildPageProps = {
  selectedVenue: Venue | null;
  onBack: () => void;
};

type BuildPhase = "site-selection" | "layout-building";

const BuildPage: React.FC<BuildPageProps> = ({ selectedVenue, onBack }) => {
  const [phase, setPhase] = useState<BuildPhase>("site-selection");
  const [selectedSite, setSelectedSite] = useState<CandidateSite | null>(null);

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
    <div className="build-page build-map-page">
      {phase === "site-selection" && (
        <>
          <MapCanvas
            venueProfile={venueProfile}
            selectedSite={selectedSite}
            onSiteSelected={setSelectedSite}
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
              CONTINUE TO BUILDING
            </button>
          </div>
        </>
      )}

      {phase === "layout-building" && (
        <div className="layout-phase-placeholder">
          <div className="layout-phase-card">
            <p className="build-step-tag">STEP 3</p>
            <h1>LAYOUT BUILDING PHASE</h1>
            <p>
              Selected concert point: X:{selectedSite?.x}, Y:{selectedSite?.y}
            </p>
            <p>
              This is where we will place speakers, barriers, support items,
              and start the real concert layout building.
            </p>

            <div className="layout-phase-actions">
              <button
                className="pixel-secondary-btn"
                onClick={() => setPhase("site-selection")}
              >
                BACK TO SITE SELECTION
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuildPage;