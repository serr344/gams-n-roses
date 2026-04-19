import React, { useMemo } from "react";

type ResultsPageProps = {
  onBackHome: () => void;
  onPlayAgain: () => void;
  finalScore: number;
  safeLimit: number;
  finalOutputDb: number;
  usedBudget: number;
  totalBudget: number;
};

const ResultsPage: React.FC<ResultsPageProps> = ({
  onBackHome,
  onPlayAgain,
  finalScore,
  safeLimit,
  finalOutputDb,
  usedBudget,
  totalBudget,
}) => {
  const analysis = useMemo(() => {
    const diff = Number((finalOutputDb - safeLimit).toFixed(1));

    if (diff > 6) {
      return {
        title: "TOO LOUD",
        statusClass: "danger",
        message:
          "Your setup pushes the sound too far above the safe limit. Nearby sensitive buildings will likely be affected. You need fewer aggressive speakers or stronger protection.",
      };
    }

    if (diff > 0) {
      return {
        title: "SLIGHTLY HIGH",
        statusClass: "warning",
        message:
          "Your plan is close, but the final output still goes a little above the safe limit. Better speaker placement or more barriers could solve this.",
      };
    }

    if (diff < -8) {
      return {
        title: "TOO SAFE",
        statusClass: "good",
        message:
          "Your setup stays well below the safe limit. That protects the city, but it may also mean you are not using the venue's full potential.",
      };
    }

    return {
      title: "WELL BALANCED",
      statusClass: "perfect",
      message:
        "This is a strong balance. Your concert output stays very close to the safe limit without going too far beyond it. GAMS approves this strategy.",
    };
  }, [finalOutputDb, safeLimit]);

  return (
    <div className="results-page pixel-results-page">
      <div className="pixel-results-shell">
        <div className="pixel-results-header">
          <div className="pixel-results-step">FINAL STEP</div>
          <h1>GAMS REVIEW</h1>
          <p>YOUR CONCERT PLAN HAS BEEN EVALUATED.</p>
        </div>

        <div className="pixel-results-stage">
          <div className={`pixel-speech-bubble ${analysis.statusClass}`}>
            <div className="pixel-speech-title">{analysis.title}</div>
            <p>{analysis.message}</p>
          </div>

          <div className="pixel-gams-wrap">
            <img
              src="/results/gams-character.png"
              alt="GAMS Character"
              className="pixel-gams-image"
            />
          </div>
        </div>

        <div className="pixel-results-stats">
          <div className="pixel-stat-card">
            <span className="pixel-stat-label">FINAL SCORE</span>
            <span className="pixel-stat-value">{finalScore}</span>
          </div>

          <div className="pixel-stat-card">
            <span className="pixel-stat-label">SAFE LIMIT</span>
            <span className="pixel-stat-value">{safeLimit} dB</span>
          </div>

          <div className="pixel-stat-card">
            <span className="pixel-stat-label">FINAL OUTPUT</span>
            <span className="pixel-stat-value">{finalOutputDb} dB</span>
          </div>

          <div className="pixel-stat-card">
            <span className="pixel-stat-label">BUDGET USED</span>
            <span className="pixel-stat-value">
              ${usedBudget} / ${totalBudget}
            </span>
          </div>
        </div>

        <div className="pixel-results-actions">
          <button className="pixel-secondary-btn" onClick={onPlayAgain}>
            PLAY AGAIN
          </button>

          <button className="pixel-primary-btn" onClick={onBackHome}>
            BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;