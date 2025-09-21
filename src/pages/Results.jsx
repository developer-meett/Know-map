import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get score data from navigation state
  const { score = 0, total = 0 } = location.state || {};

  const handleRestartQuiz = () => {
    navigate('/quiz');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Redirect to home if no score data
  if (!location.state) {
    navigate('/');
    return null;
  }

  return (
    <main className="quiz-main">
      <div className="container">
        <div className="quiz-results-container">
          <div className="quiz-results-header">
            <h3 className="quiz-results-title">Quiz Complete!</h3>
          </div>
          <p className="quiz-score">
            You scored <span className="quiz-score-number">{score}</span> out of <span className="quiz-score-number">{total}</span>
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn quiz-restart-btn" onClick={handleRestartQuiz}>
              Take Quiz Again
            </button>
            <button className="btn" onClick={handleGoHome}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResultsPage;
