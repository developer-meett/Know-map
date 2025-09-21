import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styles/HomePage.module.css';

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
        </div>
      </div>
    </main>
  );
};

export default HomePage;
