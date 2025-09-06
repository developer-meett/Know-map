import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { questions as defaultQuestions } from '../questions.js';
import { getFirestore, collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function Quiz({ items, onComplete }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [userAnswers, setUserAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 📚 LOAD QUESTIONS FROM FIRESTORE
  // Fetch questions for display (without correct answers for security)
  useEffect(() => {
    async function loadQuestions() {
      try {
        console.log('📚 Loading questions from Firestore...');
        const db = getFirestore();
        const questionsQuery = query(
          collection(db, 'quizzes', 'web-development-basics', 'questions'),
          orderBy('order')
        );
        
        const snapshot = await getDocs(questionsQuery);
        const loadedQuestions = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          loadedQuestions.push({
            id: data.id,
            question: data.question,
            options: data.options,
            topic: data.topic
            // Note: correctAnswer intentionally omitted for security
          });
        });

        if (loadedQuestions.length > 0) {
          setQuestions(loadedQuestions);
          console.log(`✅ Loaded ${loadedQuestions.length} questions`);
        } else {
          // Fallback to local questions if Firestore is empty
          console.warn('⚠️ No questions found in Firestore, using local questions');
          setQuestions(defaultQuestions);
        }
        
      } catch (error) {
        console.error('❌ Error loading questions:', error);
        // Fallback to local questions
        setQuestions(defaultQuestions);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, []);

  const q = questions[current];
  const total = questions.length;
  const isLast = current === total - 1;

  const handleSelect = (idx) => setSelected(idx);

  const handleNext = () => {
    if (selected === null) return;
    
    // Store the user's answer
    const newAnswers = [...userAnswers, selected];
    setUserAnswers(newAnswers);

    if (isLast) {
      // Quiz finished - submit to secure Cloud Function
      submitForGrading([...newAnswers]);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  // 🔐 SECURE SUBMISSION TO CLOUD FUNCTION
  // This is the correct, type-safe way to call a Firebase Cloud Function
  const submitForGrading = async (finalAnswers) => {
    setSubmitting(true);
    setError('');
    
    try {
      console.log('🎯 Submitting quiz to Cloud Function...');
      
      // Get Cloud Functions instance
      const functions = getFunctions();
      
      // Get reference to our submitQuiz function (httpsCallable for onCall functions)
      const submitQuiz = httpsCallable(functions, 'submitQuiz');
      
      // Call the function with quiz data
      // The function will automatically include authentication context
      const result = await submitQuiz({
        quizId: 'web-development-basics',
        userAnswers: finalAnswers
      });

      console.log('✅ Quiz submitted successfully:', result.data);
      
      // Navigate to enhanced results page with the report data
      navigate('/results-enhanced', { 
        state: { 
          reportId: result.data.reportId,
          overallScore: result.data.overallScore,
          totalQuestions: result.data.totalQuestions,
          correctAnswers: result.data.correctAnswers,
          topicSummary: result.data.topicSummary,
          isBackendResult: true,
          message: result.data.message
        },
        replace: true 
      });
      
    } catch (error) {
      console.error('❌ Quiz submission failed:', error);
      
      // Handle different types of Cloud Function errors
      if (error.code === 'unauthenticated') {
        setError('You must be logged in to submit the quiz. Please sign in and try again.');
      } else if (error.code === 'not-found') {
        setError('Quiz not found. Please contact support.');
      } else if (error.code === 'invalid-argument') {
        setError('Invalid quiz data. Please refresh and try again.');
      } else {
        setError('Failed to submit quiz. Please check your internet connection and try again.');
      }
      
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setUserAnswers([]);
    setSubmitting(false);
    setError('');
  };

  // Show loading state while questions are being fetched
  if (loading) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h3 className="quiz-title">Loading Quiz...</h3>
        </div>
        <p className="quiz-score">
          Fetching questions from the database...
        </p>
      </div>
    );
  }

  if (!questions || !questions.length) {
    return (
      <div className="quiz-container">
        <div className="quiz-header">
          <h3 className="quiz-title">Quiz Unavailable</h3>
        </div>
        <p className="quiz-score">
          No questions available. Please try again later.
        </p>
      </div>
    );
  }

  // Show submitting state while processing
  if (submitting) {
    return (
      <div className="quiz-results-container">
        <div className="quiz-results-header">
          <h3 className="quiz-results-title">Processing Quiz...</h3>
        </div>
        <p className="quiz-score">
          🧠 Analyzing your answers and generating your personalized learning roadmap...
        </p>
        <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
          This may take a few moments as our AI analyzes your performance by topic.
        </div>
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
          {isLast ? 'Finish Quiz' : 'Next'}
        </button>
      </div>

      {/* Show current topic and backend status */}
      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666', textAlign: 'center' }}>
        <div>Topic: <strong>{q.topic}</strong></div>
        <div style={{ marginTop: '0.5rem' }}>
          🔒 Secure backend grading enabled
        </div>
      </div>
    </div>
  );
}
