import React from "react";

type HomePageProps = {
  onStart?: () => void;
  onHowToPlay?: () => void;
};

const HomePage: React.FC<HomePageProps> = ({ onStart, onHowToPlay }) => {
  return (
    <div className="home-page">
      <div className="home-overlay" />

      <main className="home-content">
        <section className="hero-section">
          <p className="eyebrow">GAMS N' ROSES PRESENTS</p>

          <h1 className="hero-title">Echo of the Future</h1>

          <h2 className="hero-subtitle">
            Build the smartest concert venue before the city turns against your sound.
          </h2>

          <p className="hero-description">
            Choose a venue, manage your budget, place speakers and barriers,
            protect hospitals, schools, and libraries, then compare your design
            against the optimal solution calculated by GAMS.
          </p>

          <div className="hero-actions">
            <button className="primary-btn" onClick={onStart}>
              Start Game
            </button>

            <button className="secondary-btn" onClick={onHowToPlay}>
              How It Works
            </button>
          </div>
        </section>

        <section className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🏙️</div>
            <h3>Choose a Venue</h3>
            <p>
              Pick between city locations with different crowd capacities,
              nearby buildings, and difficulty levels.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔊</div>
            <h3>Design the Sound</h3>
            <p>
              Place speakers, barriers, and support tools to maximize audience
              satisfaction without breaking noise limits.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>Ask GAMS</h3>
            <p>
              Let GAMS analyze your design and compare your score with the
              optimized solution.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;