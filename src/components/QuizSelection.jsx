import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../auth/AuthContext';
import './QuizSelection.css';

const QuizSelection = ({ onQuizSelect, onBack }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);

      const quizzesSnapshot = await getDocs(collection(db, 'quizzes'));
      const quizzesData = quizzesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort quizzes by creation date (newest first)
      quizzesData.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });

      setQuizzes(quizzesData);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to load quizzes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSelect = (quiz) => {
    if (!quiz.questions || quiz.questions.length === 0) {
      alert('This quiz has no questions. Please contact an administrator.');
      return;
    }
    onQuizSelect(quiz);
  };

  if (loading) {
    return (
      <div className="quiz-selection-container">
        <div className="quiz-selection-header">
          <h2>Loading Quizzes...</h2>
        </div>
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-selection-container">
        <div className="quiz-selection-header">
          <h2>Error Loading Quizzes</h2>
          <button className="back-btn" onClick={onBack}>
            ← Back to Home
          </button>
        </div>
        <div className="error-message">
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchQuizzes}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-selection-container">
      <div className="quiz-selection-header">
        <h2>Select a Quiz</h2>
        <button className="back-btn" onClick={onBack}>
          ← Back to Home
        </button>
      </div>

      {quizzes.length === 0 ? (
        <div className="no-quizzes">
          <h3>No Quizzes Available</h3>
          <p>There are currently no quizzes available. Please check back later or contact an administrator.</p>
        </div>
      ) : (
        <div className="quiz-grid">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-header">
                <h3 className="quiz-title">{quiz.title}</h3>
                <div className="quiz-meta">
                  <span className="question-count">
                    {quiz.questions?.length || 0} questions
                  </span>
                  {quiz.createdAt && (
                    <span className="quiz-date">
                      Created: {new Date(quiz.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="quiz-card-body">
                <p className="quiz-description">
                  {quiz.description || 'No description available'}
                </p>
                
                {quiz.topics && quiz.topics.length > 0 && (
                  <div className="quiz-topics">
                    <strong>Topics:</strong>
                    <div className="topic-tags">
                      {quiz.topics.slice(0, 3).map((topic, index) => (
                        <span key={index} className="topic-tag">
                          {topic}
                        </span>
                      ))}
                      {quiz.topics.length > 3 && (
                        <span className="topic-tag more">
                          +{quiz.topics.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="quiz-card-footer">
                <button 
                  className="select-quiz-btn"
                  onClick={() => handleQuizSelect(quiz)}
                  disabled={!quiz.questions || quiz.questions.length === 0}
                >
                  {!quiz.questions || quiz.questions.length === 0 
                    ? 'No Questions Available' 
                    : 'Start Quiz'
                  }
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="quiz-selection-footer">
        <p className="user-info">
          Logged in as: {user?.displayName || user?.email}
        </p>
        <p className="quiz-count">
          {quizzes.length} quiz{quizzes.length !== 1 ? 'es' : ''} available
        </p>
      </div>
    </div>
  );
};

export default QuizSelection;
