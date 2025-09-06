import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get basic data from navigation state
  const { reportId, overallScore = 0, totalQuestions = 0, correctAnswers = 0 } = location.state || {};

  useEffect(() => {
    const fetchDetailedReport = async () => {
      if (!reportId) {
        navigate('/');
        return;
      }

      try {
        const db = getFirestore();
        const reportRef = doc(db, 'reports', reportId);
        const reportDoc = await getDoc(reportRef);

        if (reportDoc.exists()) {
          setReportData(reportDoc.data());
        } else {
          setError('Report not found');
        }
      } catch (err) {
        console.error('Error fetching report:', err);
        setError('Failed to load detailed results');
      } finally {
        setLoading(false);
      }
    };

    fetchDetailedReport();
  }, [reportId, navigate]);

  const handleRestartQuiz = () => {
    navigate('/quiz');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Redirect to home if no navigation state
  if (!location.state) {
    navigate('/');
    return null;
  }

  if (loading) {
    return (
      <main className="quiz-main">
        <div className="container">
          <div className="quiz-results-container">
            <h3>Loading your personalized learning roadmap...</h3>
          </div>
        </div>
      </main>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Mastered': return '#10b981'; // Green
      case 'Needs Revision': return '#f59e0b'; // Yellow
      case 'Learn from Scratch': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Mastered': return '🎉';
      case 'Needs Revision': return '📚';
      case 'Learn from Scratch': return '🚀';
      default: return '📋';
    }
  };

  return (
    <main className="quiz-main">
      <div className="container">
        <div className="quiz-results-container">
          {/* Overall Score */}
          <div className="quiz-results-header">
            <h3 className="quiz-results-title">Your Know-Map Results</h3>
            <p className="quiz-score">
              Overall Score: <span className="quiz-score-number">{overallScore.toFixed(1)}%</span>
            </p>
            <p className="quiz-score">
              Answered <span className="quiz-score-number">{correctAnswers}</span> out of{' '}
              <span className="quiz-score-number">{totalQuestions}</span> questions correctly
            </p>
          </div>

          {/* Learning Roadmap */}
          {reportData && reportData.classified_topics && (
            <div style={{ marginTop: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: '600' }}>
                📍 Your Personalized Learning Roadmap
              </h4>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {Object.entries(reportData.classified_topics).map(([topic, data]) => (
                  <div
                    key={topic}
                    style={{
                      border: `2px solid ${getStatusColor(data.status)}`,
                      borderRadius: '12px',
                      padding: '1rem',
                      backgroundColor: '#f9f9f9'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>{getStatusIcon(data.status)}</span>
                      <h5 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>{topic}</h5>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          backgroundColor: getStatusColor(data.status),
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}
                      >
                        {data.status}
                      </span>
                      <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                        {data.correct}/{data.total} correct ({data.score.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Study Recommendations */}
          {reportData && reportData.classified_topics && (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af' }}>💡 Study Recommendations</h4>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                {Object.entries(reportData.classified_topics).some(([_, data]) => data.status === 'Learn from Scratch') && (
                  <p><strong>🚀 Learn from Scratch:</strong> Start with fundamentals and build up your knowledge systematically.</p>
                )}
                {Object.entries(reportData.classified_topics).some(([_, data]) => data.status === 'Needs Revision') && (
                  <p><strong>📚 Needs Revision:</strong> Review key concepts and practice more problems in these areas.</p>
                )}
                {Object.entries(reportData.classified_topics).some(([_, data]) => data.status === 'Mastered') && (
                  <p><strong>🎉 Mastered:</strong> Great job! Consider helping others or exploring advanced topics.</p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn quiz-restart-btn" onClick={handleRestartQuiz}>
              Take Quiz Again
            </button>
            <button 
              className="btn" 
              onClick={handleGoHome}
              style={{ backgroundColor: '#6b7280' }}
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResultsPage;
