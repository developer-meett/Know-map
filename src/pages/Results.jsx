import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { reportId } = useParams();
  
  // Get score data from navigation state - handle both frontend and backend formats
  let score = 0;
  let total = 0;
  let analysis = null;
  let message = '';
  
  if (location.state) {
    // Check if this is backend result format
    if (location.state.analysis) {
      analysis = location.state.analysis;
      score = analysis.totalScore;
      total = analysis.totalQuestions;
      message = location.state.message || 'Quiz completed successfully!';
    } 
    // Check if this is frontend result format
    else if (location.state.score !== undefined && location.state.total !== undefined) {
      score = location.state.score;
      total = location.state.total;
      message = location.state.message || 'Quiz completed!';
    }
    // Legacy format support
    else {
      score = location.state.correctAnswers || 0;
      total = location.state.totalQuestions || 0;
    }
  }

  const handleRestartQuiz = () => {
    navigate('/quiz');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Show detailed results if we have analysis data
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <main className="quiz-main">
      <div className="container">
        <div className="quiz-results-container">
          <div className="quiz-results-header">
            <h3 className="quiz-results-title">Quiz Complete!</h3>
            {message && <p style={{ color: '#666', marginTop: '0.5rem' }}>{message}</p>}
          </div>
          <div className="quiz-score">
            You scored <span className="quiz-score-number">{score}</span> out of <span className="quiz-score-number">{total}</span>
            <div style={{ marginTop: '0.5rem', fontSize: '1.1rem', color: '#4f46e5' }}>
              ({percentage}%)
            </div>
          </div>
          
          {/* Show detailed topic analysis if available */}
          {analysis && analysis.classifiedTopics && (
            <div style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '600px', margin: '2rem auto 0' }}>
              <h4 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>Topic Performance</h4>
              {Object.entries(analysis.classifiedTopics).map(([topic, data]) => (
                <div key={topic} style={{ 
                  padding: '1rem', 
                  margin: '0.5rem 0', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>{topic}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{data.correct}/{data.total} correct ({data.percentage}%)</span>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.85rem',
                      backgroundColor: data.classification === 'Mastered' ? '#dcfce7' : 
                                    data.classification === 'Needs Revision' ? '#fef3c7' : '#fee2e2',
                      color: data.classification === 'Mastered' ? '#166534' : 
                            data.classification === 'Needs Revision' ? '#92400e' : '#dc2626'
                    }}>
                      {data.classification}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <button className="btn btn-primary" onClick={handleRestartQuiz}>
              Take Quiz Again
            </button>
            <button className="btn btn-secondary" onClick={handleGoHome}>
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ResultsPage;