import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  const handleStartQuiz = () => {
    navigate('/quiz');
  };

  return (
    <main className="hero">
      <div className="container">
        <h1 className="hero-title">
          Stop Wasting Time on <span className="highlight">Random Revision</span>
        </h1>
        <p className="hero-subtitle">
          Take diagnostic quizzes across 12+ programming languages and CS topics. Get
          personalized learning roadmaps that show exactly what you know, what needs revision,
          and what to learn from scratch.
        </p>
        <div className="cta-section">
          <button className="cta-button" onClick={handleStartQuiz}>
            Start Diagnostic Quiz →
          </button>
          <div className="quiz-info">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            ~10 minutes • Free
          </div>
        </div>
      </div>
    </main>
  );
};

export default HomePage;
