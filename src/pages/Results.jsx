import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { reportId } = useParams(); // Get reportId from URL
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState('');
  
  console.log("Results page state:", location.state);
  console.log("Report ID from URL:", reportId);

  // Fetch report data from Firestore if we have a reportId but no state
  useEffect(() => {
    const fetchReportData = async () => {
      if (reportId && !location.state) {
        setLoading(true);
        setError('');
        
        try {
          console.log("Fetching report data for ID:", reportId);
          const reportDocRef = doc(db, 'quiz_reports', reportId);
          const reportDoc = await getDoc(reportDocRef);
          
          if (reportDoc.exists()) {
            const data = reportDoc.data();
            console.log("Fetched report data:", data);
            setReportData(data);
          } else {
            console.error("No report found with ID:", reportId);
            setError('Report not found');
          }
        } catch (err) {
          console.error("Error fetching report:", err);
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
    console.error("No results data found");
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

  console.log("Processed results data:", { 
    overallScore, totalQuestions, correctAnswers, isBackendResult, currentReportId
  });
  
  // Topic breakdown - check in multiple potential locations
  const topicBreakdown = state.topicBreakdown || {};
  const classifiedTopics = report.classifiedTopics || analysis.classifiedTopics || {};
  
  // Convert classifiedTopics to topicBreakdown format if needed
  const topicData = Object.keys(classifiedTopics).length > 0 
    ? classifiedTopics 
    : topicBreakdown;
    
  console.log("Topic data:", topicData);

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
                const classification = data.classification || 
                  (topicPercentage >= 80 ? 'Mastered' : 
                   topicPercentage >= 50 ? 'Needs Revision' : 
                   'Learn from Scratch');
                
                return (
                  <div key={topic} style={{ margin: '0.5rem 0', padding: '0.5rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <strong>{topic}:</strong> {correct}/{total} ({topicPercentage}%) - <em>{classification}</em>
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
