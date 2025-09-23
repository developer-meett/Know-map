import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { questions as defaultQuestions } from '../data/quiz-public.js';
import { logger } from '../utils/logger';
import { QUIZ_CONFIG, ERROR_MESSAGES } from '../utils/constants';

export default function Quiz({ items, onComplete, quizData, onBack }) {
  // DEBUGGING: Log when component loads
  console.log("🎯 Quiz component loaded!");
  console.log("Props received:", { items, quizData, onBack });
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const quizStartTime = useRef(Date.now());
  const questionStartTime = useRef(Date.now());
  
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

  // Reset question start time when moving to next question
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [current]);

  const handleSelect = useCallback((idx) => setSelected(idx), []);

  const handleNext = useCallback(() => {
    console.log("🔘 Next button clicked! Selected:", selected, "isLast:", isLast);
    
    if (selected === null) return;
    
    // Store the user's answer
    const newAnswers = [...userAnswers, selected];
    setUserAnswers(newAnswers);

    if (isLast) {
      // Quiz finished - process results
      console.log("🏁 Quiz finished! Processing results...");
      processResults([...newAnswers]);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  }, [selected, userAnswers, isLast]);

  const processResults = useCallback(async (finalAnswers) => {
    // IMMEDIATE DEBUG LOG
    console.log("🚀 processResults function called!");
    console.log("📝 Final answers:", finalAnswers);
    
    setSubmitting(true);
    setError('');
    
    try {
      // Check if backend is available
      const backendUrl = import.meta.env.VITE_FIREBASE_FUNCTION_URL;
      
      logger.log("=== QUIZ SUBMISSION DEBUG ===");
      logger.log("Backend URL from env:", backendUrl);
      logger.log("User object:", user);
      logger.log("User email:", user?.email);
      
      // TEMPORARY DEBUG: Force log to console for deployed debugging
      console.log("🔍 DEPLOYMENT DEBUG:");
      console.log("Backend URL:", backendUrl);
      console.log("Has user:", !!user);
      console.log("All env vars:", {
        VITE_FIREBASE_FUNCTION_URL: import.meta.env.VITE_FIREBASE_FUNCTION_URL,
        VITE_QUIZ_ID: import.meta.env.VITE_QUIZ_ID,
        VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID
      });
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
          
          // Calculate total time spent
          const totalTimeSpent = Math.round((Date.now() - quizStartTime.current) / 1000); // in seconds
          
          console.log("📡 BACKEND SUBMISSION ATTEMPT:");
          console.log("Submit URL:", submitUrl);
          console.log("Quiz ID:", quizId);
          console.log("Answers object:", answersObject);
          console.log("Time spent:", totalTimeSpent, "seconds");
          console.log("Token exists:", !!idToken);
          
          logger.debug(`Submission URL: ${submitUrl}`);
          logger.debug(`Base backend URL: ${cleanBackendUrl}`);
          logger.debug("Request payload:", {
            quizId: quizId,
            answers: answersObject,
            timeSpent: totalTimeSpent
          });
          // Don't log sensitive token info even in development
          logger.debug("Auth token present:", !!idToken);
          
          console.log("🔄 Making fetch request...");
          const response = await fetch(submitUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              quizId: quizId,
              answers: answersObject,
              timeSpent: totalTimeSpent,
              deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop'
            })
          });
          
          console.log("📥 Response received:", {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });

          // Get the response text/json
          let errorData;
          let result;
          
          try {
            // Try to parse as JSON first
            const text = await response.text();
            console.log("📄 Raw response text:", text);
            
            try {
              result = JSON.parse(text);
              console.log("✅ Response parsed as JSON:", result);
              logger.log("Response parsed as JSON:", result);
            } catch (e) {
              // If not JSON, use as text
              console.log("❌ Response is not JSON:", text);
              logger.warn("Response is not JSON:", text);
              errorData = text;
            }
          } catch (e) {
            console.log("💥 Error reading response:", e);
            logger.error("Error reading response:", e);
          }
          
          if (!response.ok) {
            const errorMessage = result?.error || errorData || `HTTP Error ${response.status}`;
            console.log("🚨 Backend error response:", {
              status: response.status,
              errorMessage,
              result,
              errorData
            });
            logger.error(`Backend error [${response.status}]:`, errorMessage);
            throw new Error(`Backend error: ${response.status} - ${errorMessage}`);
          }
          
          console.log("🎉 Backend success! Response:", result);
          logger.log("Backend response:", result);
          
          // Navigate to results page with report ID and full analysis
          console.log("🧭 Navigating to results with:", {
            reportId: result.reportId,
            analysis: result.analysis
          });
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
          console.log("💥 BACKEND SUBMISSION FAILED:", {
            error: backendError,
            message: backendError.message,
            stack: backendError.stack
          });
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
      <div className="page max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Processing Quiz...</h3>
          <p className="text-lg text-gray-600">
            {import.meta.env.VITE_FIREBASE_FUNCTION_URL 
              ? 'Analyzing your answers and generating your learning roadmap...'
              : 'Calculating your results locally...'
            }
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
              <button 
                className="mt-4 px-6 py-2 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md"
                onClick={handleRestart}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const progress = ((current + 1) / total) * 100;
  const isLastQuestion = current === total - 1;

  return (
    <div className="page max-w-2xl mx-auto py-12 px-4">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      
      <div className="bg-white p-8 rounded-lg shadow-lg">
        {/* Quiz Header */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-semibold text-indigo-600">
            {q.topic || quizData?.title || 'Quiz'}
          </span>
          <span className="text-sm font-medium text-gray-500">
            Question {current + 1} of {total}
          </span>
        </div>

        {/* Question */}
        <h3 className="text-2xl font-bold text-gray-900 mb-6">{q.question}</h3>

        {/* Answer Options */}
        <div className="space-y-4">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 transform ${
                selected === idx 
                  ? 'border-indigo-600 bg-indigo-100 text-indigo-900 font-semibold shadow-md scale-[1.02]' 
                  : 'border-gray-300 text-gray-700 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-sm hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                  selected === idx 
                    ? 'border-indigo-600 bg-indigo-600' 
                    : 'border-gray-300'
                }`}>
                  {selected === idx && (
                    <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                  )}
                </div>
                <span>{opt}</span>
              </div>
            </button>
          ))}
          
          {/* Don't Know Option */}
          <button
            type="button"
            onClick={() => handleSelect(-1)}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 transform ${
              selected === -1 
                ? 'border-amber-500 bg-amber-100 text-amber-900 font-semibold shadow-md scale-[1.02]' 
                : 'border-gray-300 text-gray-700 hover:border-amber-400 hover:bg-amber-50 hover:shadow-sm hover:scale-[1.01]'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                selected === -1 
                  ? 'border-amber-500 bg-amber-500' 
                  : 'border-gray-300'
              }`}>
                {selected === -1 && (
                  <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                )}
              </div>
              <span>🤷 Don't Know</span>
            </div>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between items-center">
          <button 
            onClick={() => {
              if (current > 0) {
                setCurrent(c => c - 1);
                setSelected(userAnswers[current - 1] ?? null);
              }
            }}
            className={`px-8 py-3 font-semibold rounded-lg transition-all duration-200 min-w-[120px] ${
              current === 0 
                ? 'text-gray-600 bg-gray-200 border-2 border-gray-300 cursor-not-allowed' 
                : 'text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transform hover:scale-105'
            }`}
            disabled={current === 0}
          >
            Previous
          </button>
          <button 
            onClick={handleNext}
            className={`px-8 py-3 font-semibold rounded-lg transition-all duration-200 min-w-[120px] ${
              selected === null 
                ? 'text-gray-600 bg-gray-200 border-2 border-gray-300 cursor-not-allowed' 
                : 'text-white bg-indigo-600 border-2 border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 hover:shadow-lg transform hover:scale-105'
            }`}
            disabled={selected === null}
          >
            {isLastQuestion ? 'Finish & See Report' : 'Next'}
          </button>
        </div>

        {/* Back to Quiz Selection - Better styling and size */}
        {onBack && (
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <button 
              className="px-8 py-3 font-semibold text-gray-600 bg-white border-2 border-gray-300 rounded-lg hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 transform hover:scale-105 min-w-[180px]"
              onClick={onBack}
            >
              ← Back to Quiz Selection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
