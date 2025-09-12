import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';
import QuizSelection from '../components/QuizSelection';
import './styles/QuizPage.module.css';

const QuizPage = () => {
  const navigate = useNavigate();
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  const handleQuizComplete = (score, total) => {
    // Navigate to results page with score data
    navigate('/results', { 
      state: { score, total },
      replace: true 
    });
  };

  const handleQuizSelect = (quiz) => {
    setSelectedQuiz(quiz);
  };

  const handleBackToSelection = () => {
    setSelectedQuiz(null);
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <main className="quiz-main">
      <div className="container">
        {!selectedQuiz ? (
          <QuizSelection 
            onQuizSelect={handleQuizSelect} 
            onBack={handleBackToHome}
          />
        ) : (
          <Quiz 
            onComplete={handleQuizComplete}
            quizData={selectedQuiz}
            onBack={handleBackToSelection}
          />
        )}
      </div>
    </main>
  );
};

export default QuizPage;
