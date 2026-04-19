import React, { useState } from "react";
import HomePage from "./pages/HomePage";
import VenueSelectionPage from "./pages/VenueSelectionPage";
import BuildPage from "./pages/BuildPage";

export type Venue = {
  id: string;
  name: string;
  capacity: number;
  budget: number;
  difficulty: string;
  description: string;
};

function App() {
  const [screen, setScreen] = useState<"home" | "venues" | "build">("home");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  const handleStartFromHome = () => {
    setScreen("venues");
  };

  const handleHowToPlay = () => {
    alert(
      "Choose a venue first. Each venue has different capacity, budget, and nearby risk zones."
    );
  };

  const handleSelectVenue = (venue: Venue) => {
    setSelectedVenue(venue);
  };

  const handleStartBuild = () => {
    if (!selectedVenue) {
      alert("Please select a venue before starting the game.");
      return;
    }

    setScreen("build");
  };

  const handleBackToHome = () => {
    setScreen("home");
  };

  const handleBackToVenues = () => {
    setScreen("venues");
  };

  if (screen === "home") {
    return (
      <HomePage
        onStart={handleStartFromHome}
        onHowToPlay={handleHowToPlay}
      />
    );
  }

  if (screen === "venues") {
    return (
      <VenueSelectionPage
        selectedVenue={selectedVenue}
        onSelectVenue={handleSelectVenue}
        onBack={handleBackToHome}
        onContinue={handleStartBuild}
      />
    );
  }

  return (
    <BuildPage
      selectedVenue={selectedVenue}
      onBack={handleBackToVenues}
    />
  );
}

export default App;