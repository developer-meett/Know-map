import React from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz/Quiz';

const QuizPage = () => {
  const navigate = useNavigate();

  const handleQuizComplete = (score, total) => {
    // Navigate to results page with score data
    navigate('/results', { state: { score, total } });
  };

  return (
    <main className="quiz-main">
      <div className="container">
        <Quiz onComplete={handleQuizComplete} />
      </div>
    </main>
  );
};

export default QuizPage;
