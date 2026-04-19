import React, { useEffect, useRef, useState } from "react";

type HomePageProps = {
  onStartGame: () => void;
};

const HomePage: React.FC<HomePageProps> = ({ onStartGame }) => {  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicOn, setMusicOn] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.35;
      audioRef.current.loop = true;
    }
  }, []);

  const toggleMusic = async () => {
    if (!audioRef.current) return;

    try {
      if (musicOn) {
        audioRef.current.pause();
        setMusicOn(false);
      } else {
        await audioRef.current.play();
        setMusicOn(true);
      }
    } catch (error) {
      console.error("Music could not start:", error);
    }
  };

  const handleStartClick = async () => {
    if (audioRef.current && !musicOn) {
      try {
        await audioRef.current.play();
        setMusicOn(true);
      } catch (error) {
        console.error("Music autoplay blocked:", error);
      }
    }

    onStart?.();
  };

  return (
    <div className="home-page pixel-home">
      <audio ref={audioRef} src="/audio/theme.mp3" />

      <div className="home-bg-image" />
      <div className="home-bg-darkener" />
      <div className="pixel-grid-overlay" />

      <main className="home-shell">
        <header className="home-topbar">
          <div className="pixel-tag">GAMS N&apos; ROSES</div>

          <button className="pixel-music-btn" onClick={toggleMusic}>
            {musicOn ? "♫ MUSIC ON" : "♫ PLAY THEME"}
          </button>
        </header>

        <section className="home-hero">

          <h1 className="pixel-title">ECHO OF THE FUTURE</h1>

<p className="pixel-subtitle">
  Design the loudest show the city can survive.
</p>

<p className="pixel-description">
  Choose your district, manage your budget, place speakers and barriers,
  protect sensitive zones, and challenge the optimized solution created by GAMS.
</p>

          <div className="home-actions">
            <button className="pixel-primary-btn" onClick={onStartGame}>
  START GAME
</button>

            <button
              className="pixel-secondary-btn"
              onClick={() => setShowHowToPlay(true)}
            >
              HOW IT WORKS
            </button>
          </div>
        </section>
      </main>

      {showHowToPlay && (
        <div className="howto-backdrop" onClick={() => setShowHowToPlay(false)}>
          <div
            className="howto-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>HOW IT WORKS</h2>

<div className="howto-step">
  <span>1.</span>
  <p>
    Choose a concert venue. Every district has different capacity, budget,
    and nearby sensitive buildings.
  </p>
</div>

<div className="howto-step">
  <span>2.</span>
  <p>
    Build your layout using speakers, barriers, and support tools. Each item
    affects sound coverage, cost, and risk.
  </p>
</div>

<div className="howto-step">
  <span>3.</span>
  <p>
    Keep the audience happy while protecting hospitals, schools, libraries,
    and residential zones from excessive noise.
  </p>
</div>

<div className="howto-step">
  <span>4.</span>
  <p>
    Ask GAMS to evaluate your design and compare your score with the
    optimized solution.
  </p>
</div>

<button
  className="pixel-primary-btn howto-close-btn"
  onClick={() => setShowHowToPlay(false)}
>
  CLOSE
</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;