import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { logger } from '../utils/logger';
import './styles/Results.css';

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { reportId } = useParams(); // Get reportId from URL
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  
  logger.debug("Results page state:", location.state);
  logger.debug("Report ID from URL:", reportId);

  // Fetch report data from Firestore if we have a reportId but no state
  useEffect(() => {
    const fetchReportData = async () => {
      if (reportId && !location.state) {
        setLoading(true);
        setError('');
        
        try {
          logger.log("Fetching report data for ID:", reportId);
          const reportDocRef = doc(db, 'reports', reportId);
          const reportDoc = await getDoc(reportDocRef);
          
          if (reportDoc.exists()) {
            const data = reportDoc.data();
            logger.debug("Fetched report data:", data);
            setReportData(data);
          } else {
            logger.warn("No report found with ID:", reportId);
            setError('Report not found');
          }
        } catch (err) {
          logger.error("Error fetching report:", err);
          setError('Failed to load report');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchReportData();
  }, [reportId, location.state]);

  // Show loading state
  if (loading) {
    return (
      <main className="quiz-main">
        <div className="container">
          <div className="quiz-results-container">
            <div className="quiz-results-header">
              <h3 className="quiz-results-title">Loading Results...</h3>
            </div>
            <p>Fetching your quiz report...</p>
          </div>
        </div>
      </main>
    );
  }

  // Show error state
  if (error) {
    return (
      <main className="quiz-main">
        <div className="container">
          <div className="quiz-results-container">
            <div className="quiz-results-header">
              <h3 className="quiz-results-title">Error</h3>
            </div>
            <p style={{ color: 'red' }}>{error}</p>
            <button className="btn" onClick={() => navigate('/')}>
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Use data from navigation state or fetched report data
  const dataSource = location.state || (reportData ? { 
    report: reportData, 
    isBackendResult: true, 
    message: 'Report loaded from database',
    reportId: reportId
  } : null);

  // Redirect to home if no data available
  if (!dataSource) {
    logger.error("No results data found");
    navigate('/');
    return null;
  }

  // Extract data from state, supporting both backend and frontend formats
  const state = dataSource || {};
  
  // Check if we have a report object from the backend or fallback
  const report = state.report || {};
  const analysis = state.analysis || {};
  
  // First try to get data from the report/analysis format (backend format)
  // Then fall back to direct values (frontend fallback format)
  const {
    score = 0,
    total = 0,
    overallScore = report.overallPercentage || score,
    totalQuestions = report.totalQuestions || analysis.totalQuestions || total,
    correctAnswers = report.totalScore || analysis.totalScore || score,
    isBackendResult = state.isBackendResult || false,
    message = state.message || '',
  } = state;
  
  const currentReportId = state.reportId || reportId || 'local';

  logger.debug("Processed results data:", { 
    overallScore, totalQuestions, correctAnswers, isBackendResult, currentReportId
  });
  
  // Topic breakdown - check in multiple potential locations
  const topicBreakdown = state.topicBreakdown || {};
  const classifiedTopics = report.classifiedTopics || analysis.classifiedTopics || {};
  
  // Question breakdown for detailed review
  const questionBreakdown = report.questionBreakdown || analysis.questionBreakdown || [];
  
  // Convert classifiedTopics to topicBreakdown format if needed
  const topicData = Object.keys(classifiedTopics).length > 0 
    ? classifiedTopics 
    : topicBreakdown;
    
  logger.debug("Topic data:", topicData);
  logger.debug("Question breakdown:", questionBreakdown);

  const handleRestartQuiz = () => {
    navigate('/quiz');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const percentage = report.overallPercentage || 
                    analysis.overallPercentage || 
                    Math.round((correctAnswers / totalQuestions) * 100) || 
                    overallScore;

  return (
    <main className="quiz-main">
      <div className="container">
        <div className="quiz-results-container">
          <div className="quiz-results-header">
            <h3 className="quiz-results-title">Quiz Complete!</h3>
            {message && (
              <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                {message}
              </p>
            )}
          </div>
          
          <div className="quiz-score">
            <p>
              You scored <span className="quiz-score-number">{correctAnswers}</span> out of <span className="quiz-score-number">{totalQuestions}</span>
            </p>
            <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>
              <strong>{percentage}%</strong>
            </p>
          </div>

          {/* Topic Breakdown (if available) */}
          {(Object.keys(topicData).length > 0) && (
            <div style={{ margin: '2rem 0', textAlign: 'left' }}>
              <h4>Performance by Topic:</h4>
              {Object.entries(topicData).map(([topic, data]) => {
                // Handle both formats of topic data
                const topicPercentage = data.percentage || Math.round((data.correct / data.total) * 100);
                const correct = data.correct || 0;
                const total = data.total || 1;
                const dontKnow = data.dontKnow || 0;
                const classification = data.classification || 
                  (topicPercentage >= 80 ? 'Mastered' : 
                   topicPercentage >= 50 ? 'Needs Revision' : 
                   'Learn from Scratch');
                
                return (
                  <div key={topic} style={{ margin: '0.5rem 0', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <strong>{topic}:</strong> {correct}/{total} ({topicPercentage}%)
                    {dontKnow > 0 && <span style={{ color: '#FF6B6B', fontSize: '0.9rem' }}> • {dontKnow} "Don't Know"</span>}
                    <span style={{ marginLeft: '0.5rem' }}>- <em>{classification}</em></span>
                    <div style={{ 
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: '#ddd', 
                      borderRadius: '4px', 
                      marginTop: '0.25rem' 
                    }}>
                      <div style={{ 
                        width: `${topicPercentage}%`, 
                        height: '100%', 
                        backgroundColor: topicPercentage >= 70 ? '#4CAF50' : topicPercentage >= 50 ? '#FF9800' : '#F44336',
                        borderRadius: '4px' 
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Detailed Question Review (if available) */}
          {questionBreakdown.length > 0 && (
            <div style={{ margin: '2rem 0', textAlign: 'left' }}>
              <h4>Detailed Question Review:</h4>
              <div style={{ marginTop: '1rem' }}>
                {questionBreakdown.map((question, index) => {
                  const isCorrect = question.isCorrect;
                  const cardStyle = {
                    margin: '1rem 0',
                    padding: '1rem',
                    border: `2px solid ${isCorrect ? '#4CAF50' : '#F44336'}`,
                    backgroundColor: isCorrect ? '#f8fff8' : '#fff8f8',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  };

                  return (
                    <div key={question.questionId || index} style={cardStyle}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span style={{ 
                          fontSize: '1.2rem', 
                          color: isCorrect ? '#4CAF50' : '#F44336',
                          minWidth: '24px'
                        }}>
                          {isCorrect ? '✔️' : '❌'}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Question {index + 1}:</strong> {question.questionText}
                          </div>
                          <div style={{ 
                            fontSize: '0.9rem', 
                            color: '#666', 
                            marginBottom: '0.5rem',
                            fontStyle: 'italic'
                          }}>
                            Topic: {question.topic}
                          </div>
                          <div style={{ marginBottom: '0.25rem' }}>
                            <strong>Your Answer:</strong> {(() => {
                              if (question.userAnswer === null || question.userAnswer === undefined) {
                                return 'No answer';
                              } else if (question.userAnswer === -1) {
                                return "Don't Know";
                              } else if (question.options && question.options[question.userAnswer]) {
                                return question.options[question.userAnswer];
                              } else {
                                return `Option ${parseInt(question.userAnswer) + 1}`;
                              }
                            })()}
                          </div>
                          {!isCorrect && (
                            <div style={{ color: '#666' }}>
                              <strong>Correct Answer:</strong> {(() => {
                                if (question.options && question.options[question.correctAnswer]) {
                                  return question.options[question.correctAnswer];
                                } else {
                                  return `Option ${parseInt(question.correctAnswer) + 1}`;
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Backend Status */}
          <div style={{ margin: '1rem 0', fontSize: '0.8rem', color: '#666' }}>
            {isBackendResult ? '🔒 Securely graded by backend' : '⚠️ Frontend-only results'}
          </div>

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
