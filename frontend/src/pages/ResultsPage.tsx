import React from "react";

type ResultsPageProps = {
  onBackHome: () => void;
  onPlayAgain: () => void;
  finalScore: number;
  safeLimit: number;
  usedBudget: number;
  totalBudget: number;
};

const ResultsPage: React.FC<ResultsPageProps> = ({
  onBackHome,
  onPlayAgain,
  finalScore,
  safeLimit,
  usedBudget,
  totalBudget,
}) => {
  return (
    <div className="results-page">
      <div className="results-overlay" />

      <div className="results-content">
        <div className="results-header-card">
          <p className="results-step-tag">FINAL STEP</p>
          <h1>GAMS HAS REVIEWED YOUR CONCERT PLAN</h1>
          <p className="results-subtitle">
            Your concert layout has been evaluated. Here is your current result.
          </p>
        </div>

        <div className="results-character-wrap">
          <img
            src="/results/gams-character.png"
            alt="GAMS Character"
            className="results-character-image"
          />
        </div>

        <div className="results-stats-card">
          <div className="results-stat-box">
            <span className="results-stat-label">Final Score</span>
            <span className="results-stat-value">{finalScore}</span>
          </div>

          <div className="results-stat-box">
            <span className="results-stat-label">Safe Source Limit</span>
            <span className="results-stat-value">{safeLimit} dB</span>
          </div>

          <div className="results-stat-box">
            <span className="results-stat-label">Budget Used</span>
            <span className="results-stat-value">
              ${usedBudget} / ${totalBudget}
            </span>
          </div>
        </div>

        <div className="results-message-card">
          <h2>GAMS Says:</h2>
          <p>
            This is a first-pass evaluation screen. We can next connect real
            optimization comparison, crowd satisfaction, and noise efficiency.
          </p>
        </div>

        <div className="results-actions">
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