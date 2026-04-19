import React, { useState } from "react";
import HomePage from "./pages/HomePage";
import VenueSelectionPage from "./pages/VenueSelectionPage";
import BuildPage from "./pages/BuildPage";
import ResultsPage from "./pages/ResultsPage";

export type Venue = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  budget: number;
  difficulty: string;
};

type Screen = "home" | "venues" | "build" | "results";

type ResultData = {
  finalScore: number;
  safeLimit: number;
  usedBudget: number;
  totalBudget: number;
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [resultData, setResultData] = useState<ResultData>({
    finalScore: 0,
    safeLimit: 0,
    usedBudget: 0,
    totalBudget: 0,
  });

  return (
    <>
      {screen === "home" && (
        <HomePage onStartGame={() => setScreen("venues")} />
      )}

      {screen === "venues" && (
        <VenueSelectionPage
          selectedVenue={selectedVenue}
          onSelectVenue={setSelectedVenue}
          onBack={() => setScreen("home")}
          onContinue={() => setScreen("build")}
        />
      )}

      {screen === "build" && (
        <BuildPage
          selectedVenue={selectedVenue}
          onBack={() => setScreen("venues")}
          onFinish={(data) => {
            setResultData(data);
            setScreen("results");
          }}
        />
      )}

      {screen === "results" && (
        <ResultsPage
          finalScore={resultData.finalScore}
          safeLimit={resultData.safeLimit}
          usedBudget={resultData.usedBudget}
          totalBudget={resultData.totalBudget}
          onBackHome={() => {
            setSelectedVenue(null);
            setScreen("home");
          }}
          onPlayAgain={() => {
            setScreen("venues");
          }}
        />
      )}
    </>
  );
};

export default App;