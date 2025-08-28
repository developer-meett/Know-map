import React from 'react';

const Results = ({ score, totalQuestions, onRestart }) => {
  return (
    <div className="results-container">
      <h2>Quiz Completed!</h2>
      
      <p>Your final score is: {score} out of {totalQuestions}</p>
      
      <button onClick={onRestart}>Take Again</button>
    </div>
  );
};

export default Results;
