import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { questions as defaultQuestions } from '../questions.js';

export default function Quiz({ items, onComplete }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qs = useMemo(() => (Array.isArray(items) && items.length ? items : defaultQuestions), [items]);
  
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const q = qs[current];
  const total = qs.length;
  const isLast = current === total - 1;

  const handleSelect = (idx) => setSelected(idx);

  const handleNext = () => {
    if (selected === null) return;
    
    // Store the user's answer
    const newAnswers = [...userAnswers, selected];
    setUserAnswers(newAnswers);

    if (isLast) {
      // Quiz finished - process results
      processResults([...newAnswers]);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  const processResults = async (finalAnswers) => {
    setSubmitting(true);
    setError('');
    
    try {
      // Check if backend is available
      const backendUrl = import.meta.env.VITE_CLOUD_FUNCTION_URL;
      
      if (backendUrl && user) {
        // Try backend submission
        try {
          const idToken = await user.getIdToken();
          
          const response = await fetch(`${backendUrl}/submit_quiz`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              quizId: 'web-development-basics',
              userAnswers: finalAnswers
            })
          });

          if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
          }

          const result = await response.json();
          
          // Navigate to enhanced results with backend data
          navigate('/results-enhanced', { 
            state: { 
              reportId: result.reportId,
              overallScore: result.overallScore,
              totalQuestions: result.totalQuestions,
              correctAnswers: result.correctAnswers,
              isBackendResult: true
            },
            replace: true 
          });
          return;
          
        } catch (backendError) {
          console.warn('Backend submission failed, falling back to frontend:', backendError);
        }
      }
      
      // Fallback: Frontend-only processing
      const results = calculateFrontendResults(finalAnswers);
      
      // Navigate to results with frontend-calculated data
      navigate('/results', { 
        state: { 
          ...results,
          isBackendResult: false,
          message: backendUrl ? 'Backend unavailable - showing local results' : 'Running in frontend-only mode'
        },
        replace: true 
      });
      
    } catch (error) {
      console.error('Quiz submission failed:', error);
      setError('Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  const calculateFrontendResults = (finalAnswers) => {
    let correctCount = 0;
    const topicScores = {};
    
    finalAnswers.forEach((answerIndex, questionIndex) => {
      const question = qs[questionIndex];
      const isCorrect = answerIndex === question.correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      }
      
      // Track topic performance
      const topic = question.topic || 'General';
      if (!topicScores[topic]) {
        topicScores[topic] = { correct: 0, total: 0 };
      }
      topicScores[topic].total++;
      if (isCorrect) {
        topicScores[topic].correct++;
      }
    });
    
    const overallScore = Math.round((correctCount / total) * 100);
    
    return {
      overallScore,
      totalQuestions: total,
      correctAnswers: correctCount,
      topicBreakdown: topicScores,
      userAnswers: finalAnswers,
      timestamp: new Date().toISOString()
    };
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setUserAnswers([]);
    setSubmitting(false);
    setError('');
  };

  if (!qs || !qs.length) return null;

  // Show submitting state while processing
  if (submitting) {
    return (
      <div className="quiz-results-container">
        <div className="quiz-results-header">
          <h3 className="quiz-results-title">Processing Quiz...</h3>
        </div>
        <p className="quiz-score">
          {import.meta.env.VITE_CLOUD_FUNCTION_URL 
            ? 'Analyzing your answers and generating your learning roadmap...'
            : 'Calculating your results locally...'
          }
        </p>
        {error && (
          <div className="error-message" style={{color: 'red', marginTop: '1rem'}}>
            {error}
            <button 
              className="btn quiz-restart-btn" 
              onClick={handleRestart}
              style={{marginTop: '1rem'}}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h3 className="quiz-title">Question {current + 1}</h3>
        <div className="quiz-progress">({current + 1} / {total})</div>
      </div>

      <div className="quiz-question">{q.question}</div>

      <div className="quiz-options">
        {q.options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSelect(idx)}
            aria-pressed={selected === idx}
            className={`quiz-option ${selected === idx ? 'quiz-option-selected' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>

      <div className="quiz-footer">
        <div />
        <button
          onClick={handleNext}
          disabled={selected === null}
          className={`btn ${selected === null ? 'btn-disabled' : ''}`}
        >
          {isLast ? 'Finish' : 'Next'}
        </button>
      </div>

      {/* Show backend status */}
      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
        {import.meta.env.VITE_CLOUD_FUNCTION_URL 
          ? '🔒 Secure backend grading enabled'
          : '⚠️ Running in frontend-only mode'
        }
      </div>
    </div>
  );
}
