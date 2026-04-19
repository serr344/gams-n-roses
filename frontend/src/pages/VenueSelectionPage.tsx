import React from "react";
import type { Venue } from "../App";

type VenueSelectionPageProps = {
  selectedVenue: Venue | null;
  onSelectVenue: (venue: Venue) => void;
  onBack: () => void;
  onContinue: () => void;
};

const venues: Venue[] = [
  {
    id: "downtown-plaza",
    name: "Downtown Plaza",
    capacity: 1000,
    budget: 1400,
    difficulty: "Hard",
    description:
      "High audience potential, but surrounded by offices, shopping areas, and dense buildings.",
  },
  {
    id: "riverside-park",
    name: "Riverside Park",
    capacity: 700,
    budget: 1100,
    difficulty: "Medium",
    description:
      "Balanced open area with moderate crowd size, but closer to residential and library zones.",
  },
  {
    id: "edge-district-lot",
    name: "Edge District Lot",
    capacity: 500,
    budget: 950,
    difficulty: "Easy",
    description:
      "Safer area near warehouse and parking spaces, but with lower crowd potential.",
  },
];

const VenueSelectionPage: React.FC<VenueSelectionPageProps> = ({
  selectedVenue,
  onSelectVenue,
  onBack,
  onContinue,
}) => {
  return (
    <div className="venue-page">
      <div className="venue-container">
        <div className="venue-header">
          <p className="venue-eyebrow">STEP 1</p>
          <h1>Select Your Concert Venue</h1>
          <p className="venue-subtitle">
            Choose carefully. Every location changes your crowd potential,
            budget, and nearby sensitive buildings.
          </p>
        </div>

        <div className="venue-grid">
          {venues.map((venue) => {
            const isSelected = selectedVenue?.id === venue.id;

            return (
              <button
                type="button"
                key={venue.id}
                className={`venue-card ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectVenue(venue)}
              >
                <div className="venue-badge">{venue.difficulty}</div>
                <h3>{venue.name}</h3>
                <p>{venue.description}</p>

                <div className="venue-stats">
                  <span>Capacity: {venue.capacity}</span>
                  <span>Budget: ${venue.budget}</span>
                </div>

                {isSelected && <div className="venue-selected-text">Selected</div>}
              </button>
            );
          })}
        </div>

        <div className="venue-actions">
          <button type="button" className="secondary-btn" onClick={onBack}>
            Back
          </button>

          <button type="button" className="primary-btn" onClick={onContinue}>
            Start Building
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueSelectionPage;