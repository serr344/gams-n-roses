import React from "react";
import type { Venue } from "../App";

type BuildPageProps = {
  selectedVenue: Venue | null;
  onBack: () => void;
};

const BuildPage: React.FC<BuildPageProps> = ({ selectedVenue, onBack }) => {
  return (
    <div className="build-page">
      <div className="build-container">
        <p className="venue-eyebrow">STEP 2</p>
        <h1>Build Your Concert Layout</h1>

        {selectedVenue ? (
          <div className="build-summary-card">
            <h2>{selectedVenue.name}</h2>
            <p>{selectedVenue.description}</p>
            <div className="venue-stats">
              <span>Capacity: {selectedVenue.capacity}</span>
              <span>Budget: ${selectedVenue.budget}</span>
              <span>Difficulty: {selectedVenue.difficulty}</span>
            </div>
          </div>
        ) : (
          <p>No venue selected.</p>
        )}

        <div className="build-placeholder">
          Concert map and item placement area will go here.
        </div>

        <button type="button" className="secondary-btn" onClick={onBack}>
          Back to Venues
        </button>
      </div>
    </div>
  );
};

export default BuildPage;