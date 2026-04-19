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
      "Huge audience potential, but dense buildings and busy city blocks make noise control harder.",
  },
  {
    id: "riverside-park",
    name: "Riverside Park",
    capacity: 700,
    budget: 1100,
    difficulty: "Medium",
    description:
      "Balanced open area with decent crowd capacity, but sensitive zones are closer than they look.",
  },
  {
    id: "edge-district-lot",
    name: "Edge District Lot",
    capacity: 500,
    budget: 950,
    difficulty: "Easy",
    description:
      "Safer industrial-side location with fewer complaints, but lower crowd potential and less hype.",
  },
];

const VenueSelectionPage: React.FC<VenueSelectionPageProps> = ({
  selectedVenue,
  onSelectVenue,
  onBack,
  onContinue,
}) => {
  return (
    <div className="venue-page pixel-venue-page">
      <div className="venue-bg-overlay" />

      <main className="venue-shell">
        <section className="venue-hero">
          <p className="venue-step-tag">STEP 1</p>
          <h1 className="venue-title">SELECT YOUR CONCERT VENUE</h1>
          <p className="venue-description">
  Choose the district for your concert. Each venue offers a different
  budget, audience size, and surrounding noise constraints.
</p>
        </section>

        <section className="venue-grid">
          {venues.map((venue) => {
            const isSelected = selectedVenue?.id === venue.id;

            return (
              <button
                key={venue.id}
                type="button"
                className={`venue-card ${isSelected ? "selected" : ""}`}
                onClick={() => onSelectVenue(venue)}
              >
                <div className="venue-card-top">
                  <span
                    className={`venue-difficulty difficulty-${venue.difficulty.toLowerCase()}`}
                  >
                    {venue.difficulty}
                  </span>
                  {isSelected && <span className="venue-picked">SELECTED</span>}
                </div>

                <h3>{venue.name}</h3>
                <p>{venue.description}</p>

                <div className="venue-meta">
                  <span>Capacity: {venue.capacity}</span>
                  <span>Budget: ${venue.budget}</span>
                </div>
              </button>
            );
          })}
        </section>

        <div className="venue-footer-actions">
          <button className="pixel-secondary-btn" onClick={onBack}>
            BACK
          </button>

          <button className="pixel-primary-btn" onClick={onContinue}>
            SELECT
          </button>
        </div>
      </main>
    </div>
  );
};

export default VenueSelectionPage;