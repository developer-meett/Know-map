import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { questions as defaultQuestions } from '../data/quiz-public.js';
import { logger } from '../utils/logger';
import { QUIZ_CONFIG, ERROR_MESSAGES } from '../utils/constants';
import './styles/Quiz.module.css';

export default function Quiz({ items, onComplete, quizData, onBack }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use quizData.questions if provided, otherwise fall back to items or defaultQuestions
  const qs = useMemo(() => {
    if (quizData && quizData.questions && quizData.questions.length > 0) {
      // Convert admin-created quiz format to the format expected by the Quiz component
      return quizData.questions.map((q, index) => ({
        id: q.id || `q${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct, // Map 'correct' to 'correctAnswer'
        topic: q.topic || 'General'
      }));
    }
    return Array.isArray(items) && items.length ? items : defaultQuestions;
  }, [items, quizData]);
  
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const q = qs[current];
  const total = qs.length;
  const isLast = current === total - 1;

  const handleSelect = useCallback((idx) => setSelected(idx), []);

  const handleNext = useCallback(() => {
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
  }, [selected, userAnswers, isLast]);

  const processResults = useCallback(async (finalAnswers) => {
    setSubmitting(true);
    setError('');
    
    try {
      // Check if backend is available
      const backendUrl = import.meta.env.VITE_FIREBASE_FUNCTION_URL;
      
      logger.log("=== QUIZ SUBMISSION DEBUG ===");
      logger.log("Backend URL from env:", backendUrl);
      logger.log("User object:", user);
      logger.log("User email:", user?.email);
      logger.debug("All env vars:", {
        VITE_FIREBASE_FUNCTION_URL: import.meta.env.VITE_FIREBASE_FUNCTION_URL,
        VITE_QUIZ_ID: import.meta.env.VITE_QUIZ_ID,
        VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID
      });
      
      if (backendUrl && user) {
        // Try backend submission
        try {
          logger.log("Attempting backend submission...");
          const idToken = await user.getIdToken();
          logger.log("Got user token, preparing data...");
          
          // Prepare answers in the format expected by the backend
          // Make sure all answers are sent as numbers, not strings
          const answersObject = {};
          finalAnswers.forEach((answerIndex, questionIndex) => {
            // Convert answer to number to ensure consistent type for backend comparison
            const numericAnswer = parseInt(answerIndex, 10);
            answersObject[questionIndex.toString()] = numericAnswer;
          });
          
          // Use dynamic quiz ID if available, otherwise fall back to env var
          const quizId = quizData?.id || import.meta.env.VITE_QUIZ_ID || QUIZ_CONFIG.DEFAULT_QUIZ_ID;
          logger.log(`Using Quiz ID: ${quizId}`);
          logger.log(`Quiz title: ${quizData?.title || 'Default Quiz'}`);
          
          // Firebase Cloud Functions have a specific URL structure
          // The path is important - it needs to match exactly what the function expects
          
          // Remove trailing slashes from backend URL if present
          const cleanBackendUrl = backendUrl.replace(/\/+$/, '');
          
          // Create the submission URL with the exact path expected by the backend
          const submitUrl = `${cleanBackendUrl}/submitQuiz`;
            
          logger.debug(`Submission URL: ${submitUrl}`);
          logger.debug(`Base backend URL: ${cleanBackendUrl}`);
          logger.debug("Request payload:", {
            quizId: quizId,
            answers: answersObject
          });
          // Don't log sensitive token info even in development
          logger.debug("Auth token present:", !!idToken);
          
          const response = await fetch(submitUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              quizId: quizId,
              answers: answersObject
            })
          });

          // Get the response text/json
          let errorData;
          let result;
          
          try {
            // Try to parse as JSON first
            const text = await response.text();
            try {
              result = JSON.parse(text);
              logger.log("Response parsed as JSON:", result);
            } catch (e) {
              // If not JSON, use as text
              logger.warn("Response is not JSON:", text);
              errorData = text;
            }
          } catch (e) {
            logger.error("Error reading response:", e);
          }
          
          if (!response.ok) {
            const errorMessage = result?.error || errorData || `HTTP Error ${response.status}`;
            logger.error(`Backend error [${response.status}]:`, errorMessage);
            throw new Error(`Backend error: ${response.status} - ${errorMessage}`);
          }
          logger.log("Backend response:", result);
          
          // Navigate to results page with report ID and full analysis
          navigate(`/results/${result.reportId}`, { 
            state: { 
              reportId: result.reportId,
              analysis: result.analysis,
              report: result,
              isBackendResult: true,
              message: 'Quiz submitted and analyzed successfully!'
            },
            replace: true 
          });
          return;
          
        } catch (backendError) {
          logger.error('Backend submission failed - DETAILED ERROR:', backendError);
          logger.error('Error message:', backendError.message);
          logger.debug('Error stack:', backendError.stack);
          setError(`Backend error: ${backendError.message}`);
        }
      }
      
      // Fallback: Frontend-only processing
      logger.log("Using frontend fallback processing...");
      const results = calculateFrontendResults(finalAnswers);
      
      // Create a complete report object similar to what the backend would return
      const fallbackReport = {
        overallPercentage: results.overallScore,
        totalScore: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        classifiedTopics: Object.entries(results.topicBreakdown).reduce((acc, [topic, data]) => {
          const percentage = Math.round((data.correct / data.total) * 100);
          
          // If any "Don't Know" answers exist for this topic, automatically classify as "Learn from Scratch"
          let classification;
          if (data.dontKnow && data.dontKnow > 0) {
            classification = "Learn from Scratch";
          } else {
            classification = percentage >= QUIZ_CONFIG.MASTERY_THRESHOLD * 100 ? "Mastered" : 
                          percentage >= QUIZ_CONFIG.REVISION_THRESHOLD * 100 ? "Needs Revision" : "Learn from Scratch";
          }
          
          acc[topic] = {
            classification: classification,
            correct: data.correct,
            total: data.total,
            dontKnow: data.dontKnow || 0,
            percentage: percentage
          };
          return acc;
        }, {}),
        submittedAt: new Date().toISOString(),
        userAnswers: results.userAnswers
      };
      
      logger.debug("Created fallback report:", fallbackReport);
      
      // Navigate to results with frontend-calculated data in a format consistent with backend
      navigate('/results', { 
        state: { 
          ...results,
          report: fallbackReport,
          isBackendResult: false,
          message: backendUrl ? 'Backend unavailable - showing local results' : 'Running in frontend-only mode'
        },
        replace: true 
      });
      
    } catch (error) {
      logger.error('Quiz submission failed - CRITICAL ERROR:', error);
      logger.debug('Error stack:', error.stack);
      setError(ERROR_MESSAGES.QUIZ_SUBMIT_FAILED);
    } finally {
      setSubmitting(false);
    }
  }, [user, navigate]);

  const calculateFrontendResults = (finalAnswers) => {
    let correctCount = 0;
    const topicScores = {};
    
    finalAnswers.forEach((answerIndex, questionIndex) => {
      const question = qs[questionIndex];
      // Handle "Don't Know" answers (-1) as automatically incorrect
      const isCorrect = answerIndex !== -1 && answerIndex === question.correctAnswer;
      const isDontKnow = answerIndex === -1;
      
      if (isCorrect) {
        correctCount++;
      }
      
      // Track topic performance
      const topic = question.topic || 'General';
      if (!topicScores[topic]) {
        topicScores[topic] = { correct: 0, total: 0, dontKnow: 0 };
      }
      topicScores[topic].total++;
      if (isCorrect) {
        topicScores[topic].correct++;
      }
      if (isDontKnow) {
        topicScores[topic].dontKnow = (topicScores[topic].dontKnow || 0) + 1;
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
          {import.meta.env.VITE_FIREBASE_FUNCTION_URL 
            ? 'Analyzing your answers and generating your learning roadmap...'
            : 'Calculating your results locally...'
          }
        </p>
        {error && (
          <div className="error-message" style={{color: 'red', marginTop: '1rem'}}>
            {error}
            <button 
              className="btn btn-danger" 
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
      {/* Quiz Header with Back Button and Title */}
      <div className="quiz-meta-header">
        {onBack && (
          <button className="btn btn-secondary" onClick={onBack}>
            ← Back to Quiz Selection
          </button>
        )}
        <div className="quiz-info">
          <h2 className="quiz-main-title">{quizData?.title || 'Quiz'}</h2>
          {quizData?.description && (
            <p className="quiz-description">{quizData.description}</p>
          )}
        </div>
      </div>

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
        {/* Don't Know option - always index -1 */}
        <button
          type="button"
          onClick={() => handleSelect(-1)}
          aria-pressed={selected === -1}
          className={`quiz-option quiz-option-dont-know ${selected === -1 ? 'quiz-option-selected' : ''}`}
        >
          🤷 Don't Know
        </button>
      </div>

      <div className="quiz-footer">
        <div />
        <button
          onClick={handleNext}
          disabled={selected === null}
          className={`btn btn-primary ${selected === null ? 'btn-disabled' : ''}`}
        >
          {isLast ? 'Finish' : 'Next'}
        </button>
      </div>

      {/* Show backend status */}
      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
        {import.meta.env.VITE_FIREBASE_FUNCTION_URL 
          ? '🔒 Secure backend grading enabled'
          : '⚠️ Running in frontend-only mode'
        }
      </div>
    </div>
  );
}
