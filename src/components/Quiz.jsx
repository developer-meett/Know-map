import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { apiFetch } from '../api/client';
import { questions as defaultQuestions } from '../data/quiz-public.js';
import { QUIZ_CONFIG, ERROR_MESSAGES } from '../utils/constants';
import './Quiz.css';

export default function Quiz({ items, onComplete, quizData, onBack }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const quizStartTime = useRef(Date.now());
  const questionStartTime = useRef(Date.now());

  // Use quizData.questions if provided, otherwise fall back to items or defaultQuestions
  const qs = useMemo(() => {
    if (quizData && quizData.questions && quizData.questions.length > 0) {
      return quizData.questions.map((q, index) => ({
        id: q.id || `q${index}`,
        question: q.question,
        options: q.options,
        correctAnswer: q.correct,
        topic: q.topic || 'General',
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

  // Reset question start time when moving to next question
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [current]);

  const handleSelect = useCallback((idx) => setSelected(idx), []);

  const handleNext = useCallback(() => {
    if (selected === null) return;

    const newAnswers = [...userAnswers, selected];
    setUserAnswers(newAnswers);

    if (isLast) {
      processResults([...newAnswers]);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }, [selected, userAnswers, isLast]);

  const processResults = useCallback(async (finalAnswers) => {
    setSubmitting(true);
    setError('');

    // Build answers object keyed by question ID
    const answersObject = {};
    finalAnswers.forEach((answerIndex, questionIndex) => {
      const qObj = qs[questionIndex];
      const qid = qObj.id || qObj._id || questionIndex.toString();
      answersObject[qid] = parseInt(answerIndex, 10);
    });

    const totalTimeSpent = Math.round((Date.now() - quizStartTime.current) / 1000);
    const deviceType = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop';

    // ── Authenticated users: always use the backend ───────────────────────────
    if (user) {
      try {
        const quizId = quizData?._id || quizData?.id;
        if (!quizId) {
          throw new Error('Quiz ID is missing — cannot submit to backend.');
        }

        const result = await apiFetch(`/quizzes/${quizId}/submit`, {
          method: 'POST',
          body: JSON.stringify({
            answers: answersObject,
            timeSpent: totalTimeSpent,
            deviceType,
          }),
        });

        navigate(`/results/${result.reportId}`, {
          state: {
            reportId: result.reportId,
            analysis: result.analysis,
            report: result,
            xpEarned: result.xpEarned,
            isPerfectScore: result.isPerfectScore,
            message: result.message,
          },
          replace: true,
        });
        return;
      } catch (err) {
        setError(`Submission failed: ${err.message}. Please try again.`);
        setSubmitting(false);
        return;
      }
    }

    // ── Guest mode: frontend-only calculation (no account, no persistence) ────
    try {
      const results = calculateFrontendResults(finalAnswers);

      const fallbackReport = {
        overallPercentage: results.overallScore,
        totalScore: results.correctAnswers,
        totalQuestions: results.totalQuestions,
        classifiedTopics: Object.entries(results.topicBreakdown).reduce((acc, [topic, data]) => {
          const percentage = Math.round((data.correct / data.total) * 100);
          let classification;
          if (data.dontKnow && data.dontKnow > 0) {
            classification = 'Learn from Scratch';
          } else {
            classification =
              percentage >= QUIZ_CONFIG.MASTERY_THRESHOLD * 100
                ? 'Mastered'
                : percentage >= QUIZ_CONFIG.REVISION_THRESHOLD * 100
                ? 'Needs Revision'
                : 'Learn from Scratch';
          }
          acc[topic] = {
            classification,
            correct: data.correct,
            total: data.total,
            dontKnow: data.dontKnow || 0,
            percentage,
          };
          return acc;
        }, {}),
        submittedAt: new Date().toISOString(),
        userAnswers: results.userAnswers,
      };

      navigate('/results', {
        state: {
          ...results,
          report: fallbackReport,
          isBackendResult: false,
          message: 'Guest mode — sign in to save your progress',
        },
        replace: true,
      });
    } catch (err) {
      setError(ERROR_MESSAGES.QUIZ_SUBMIT_FAILED);
    } finally {
      setSubmitting(false);
    }
  }, [user, navigate, quizData, qs]);

  const calculateFrontendResults = (finalAnswers) => {
    let correctCount = 0;
    const topicScores = {};

    finalAnswers.forEach((answerIndex, questionIndex) => {
      const question = qs[questionIndex];
      const isCorrect = answerIndex !== -1 && answerIndex === question.correctAnswer;
      const isDontKnow = answerIndex === -1;

      if (isCorrect) correctCount++;

      const topic = question.topic || 'General';
      if (!topicScores[topic]) {
        topicScores[topic] = { correct: 0, total: 0, dontKnow: 0 };
      }
      topicScores[topic].total++;
      if (isCorrect) topicScores[topic].correct++;
      if (isDontKnow) topicScores[topic].dontKnow++;
    });

    return {
      overallScore: Math.round((correctCount / total) * 100),
      totalQuestions: total,
      correctAnswers: correctCount,
      topicBreakdown: topicScores,
      userAnswers: finalAnswers,
      timestamp: new Date().toISOString(),
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

  // ── Submitting state ──────────────────────────────────────────────────────
  if (submitting) {
    return (
      <div className="quiz-container">
        <div className="quiz-message-card">
          <h3 className="quiz-message-title">Processing Quiz...</h3>
          <p className="quiz-message-desc">
            Analyzing your answers and generating your learning roadmap...
          </p>
        </div>
      </div>
    );
  }

  // ── Error state (only shown when not submitting — retry is possible) ──────
  if (error) {
    return (
      <div className="quiz-container">
        <div className="quiz-message-card">
          <h3 className="quiz-message-title error">Submission Failed</h3>
          <p className="quiz-message-desc">{error}</p>
          <button className="btn-primary" onClick={handleRestart}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const progress = ((current + 1) / total) * 100;
  const isLastQuestion = current === total - 1;

  return (
    <div className="quiz-container">
      {/* Progress Bar */}
      <div className="quiz-progress-container">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="quiz-card">
        {/* Quiz Header */}
        <div className="quiz-header">
          <span className="quiz-topic">
            {q.topic || quizData?.title || 'Quiz'}
          </span>
          <span className="quiz-progress-text">
            Question {current + 1} of {total}
          </span>
        </div>

        {/* Question */}
        <h3 className="quiz-question-text">{q.question}</h3>

        {/* Answer Options */}
        <div className="quiz-options-grid">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              className={`quiz-option-btn ${selected === idx ? 'selected' : ''}`}
            >
              <div className="quiz-radio">
                {selected === idx && <div className="quiz-radio-inner"></div>}
              </div>
              <span>{opt}</span>
            </button>
          ))}

          {/* Don't Know Option */}
          <button
            type="button"
            onClick={() => handleSelect(-1)}
            className={`quiz-option-btn dont-know ${selected === -1 ? 'selected' : ''}`}
          >
            <div className="quiz-radio">
              {selected === -1 && <div className="quiz-radio-inner"></div>}
            </div>
            <span>Don't Know this topic</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="quiz-actions">
          <button
            onClick={() => {
              if (current > 0) {
                setCurrent((c) => c - 1);
                setSelected(userAnswers[current - 1] ?? null);
              }
            }}
            className="btn-nav prev"
            disabled={current === 0}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="btn-nav next"
            disabled={selected === null}
          >
            {isLastQuestion ? 'Finish & See Report' : 'Next'}
          </button>
        </div>

        {/* Back to Quiz Selection */}
        {onBack && (
          <div className="quiz-back-btn-container">
            <button
              className="btn-back-selection"
              onClick={onBack}
            >
              Back to Quiz Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
