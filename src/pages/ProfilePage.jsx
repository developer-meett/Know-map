import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [topicProgress, setTopicProgress] = useState({});
  const [trends, setTrends] = useState({});
  const [roadmap, setRoadmap] = useState({ readyFor: [], learnNext: [], notReadyFor: [] });
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      // Fetch profile and reports in parallel
      const [meData, reportsData, trendsData, roadmapData] = await Promise.all([
        apiFetch('/auth/me'),
        apiFetch('/reports'),
        apiFetch('/reports/trends').catch(() => null),
        apiFetch('/reports/roadmap').catch(() => null),
      ]);

      if (meData.success) {
        const defaultStats = {
          totalQuizzesTaken: 0,
          totalTimeSpent: 0,
          totalXP: 0,
          level: 1,
          averageScore: 0,
          perfectScores: 0,
        };
        setUserProfile({
          ...meData.user,
          stats: { ...defaultStats, ...(meData.user.stats || {}) },
        });
      }

      if (reportsData.success) {
        // Reports are already sorted newest-first; take the 5 most recent
        const recent = (reportsData.reports || []).slice(0, 5);
        setRecentAttempts(recent);

        // Derive topic progress from the fetched reports
        const topicStats = {};
        recent.forEach(attempt => {
          if (attempt.topicBreakdown) {
            Object.entries(attempt.topicBreakdown).forEach(([topic, stats]) => {
              if (!topicStats[topic]) {
                topicStats[topic] = { correct: 0, total: 0, attempts: 0 };
              }
              topicStats[topic].correct += stats.correct || 0;
              topicStats[topic].total   += stats.total   || 0;
              topicStats[topic].attempts += 1;
            });
          }
        });
        Object.keys(topicStats).forEach(topic => {
          const s = topicStats[topic];
          s.percentage = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
          s.skillLevel = getSkillLevel(s.percentage);
        });
        setTopicProgress(topicStats);
      }

      if (trendsData?.success) setTrends(trendsData.trends);
      if (roadmapData?.success) setRoadmap(roadmapData.roadmap);

      // Achievements are stubbed as empty for now (per migration spec)
      setAchievements([]);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const getSkillLevel = (percentage) => {
    if (percentage >= 90) return 'Expert';
    if (percentage >= 75) return 'Advanced';
    if (percentage >= 60) return 'Intermediate';
    return 'Beginner';
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown';
    // MERN backend returns ISO 8601 strings, not Firestore Timestamps
    return new Date(dateValue).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${Math.round(minutes)}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <main className="profile-page page container">
        <div className="loading-container card">
          <div className="spinner"></div>
          <p style={{ marginTop: 'var(--space-4)', color: 'var(--text-muted)' }}>Loading your profile...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="profile-page page container">
        <div className="error-container card">
          <h3 style={{ color: 'var(--danger)' }}>Error Loading Profile</h3>
          <p style={{ color: 'var(--text-muted)' }}>{error}</p>
        </div>
      </main>
    );
  }

  const stats = userProfile?.stats || {};

  return (
    <main className="profile-page page container">
      {/* Back Button */}
      <div className="profile-header-nav">
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          &larr; Back to Home
        </button>
      </div>

      {/* Profile Header */}
      <div className="profile-header card">
        <div className="profile-avatar">
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="Profile" />
          ) : (
            <div className="avatar-placeholder">
              {userProfile?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h1>{userProfile?.displayName || user?.email?.split('@')[0] || 'User'}</h1>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-joined">
            Joined {formatDate(userProfile?.createdAt)} • Level {stats.level}
          </p>
        </div>
        <div className="profile-xp">
          <div className="xp-display">
            <span className="xp-amount">{stats.totalXP}</span>
            <span className="xp-label">XP</span>
          </div>
          <div className="level-progress">
            <div 
              className="level-progress-bar"
              style={{ width: `${(stats.totalXP % 100)}%` }}
            ></div>
          </div>
          <p className="next-level">
            {100 - (stats.totalXP % 100)} XP to Level {stats.level + 1}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card-item card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <h3>{stats.totalQuizzesTaken}</h3>
            <p>Quizzes Completed</p>
          </div>
        </div>
        
        <div className="stat-card-item card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <h3>{stats.averageScore}%</h3>
            <p>Average Score</p>
          </div>
        </div>
        
        <div className="stat-card-item card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <h3>{formatTime(stats.totalTimeSpent)}</h3>
            <p>Time Spent</p>
          </div>
        </div>
        
        <div className="stat-card-item card">
          <div className="stat-icon"></div>
          <div className="stat-content">
            <h3>{stats.perfectScores}</h3>
            <p>Perfect Scores</p>
          </div>
        </div>
      </div>

      <div className="analytics-dashboard">
        <div className="dashboard-left">
          {/* Recent Activity */}
          <div className="profile-section card">
            <h2>Recent Quiz Attempts</h2>
            {recentAttempts.length > 0 ? (
              <div className="recent-attempts">
                {recentAttempts.map((attempt) => (
                  <div key={attempt._id} className="attempt-card card-elevated">
                    <div className="attempt-header">
                      <h4>{attempt.quizId?.title || 'Unknown Quiz'}</h4>
                      <span className={`score ${attempt.isPerfectScore ? 'perfect' : ''}`}>
                        {attempt.score}/{attempt.totalQuestions}
                      </span>
                    </div>
                    <div className="attempt-details">
                      <span className="percentage">{attempt.percentage}%</span>
                      <span className="date">{formatDate(attempt.completedAt)}</span>
                      {attempt.isPerfectScore && <span className="perfect-badge">Perfect!</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No quiz attempts yet. Take your first quiz to see your progress here!</p>
              </div>
            )}
          </div>

        </div>

        <div className="dashboard-right">
          {/* Topic Progress */}
          {Object.keys(topicProgress).length > 0 && (
            <div className="profile-section card">
              <h2>Topic Progress</h2>
              <div className="topic-grid">
                {Object.entries(topicProgress).map(([topic, progress]) => (
                  <div key={topic} className="topic-card-item card-elevated">
                    <h4>{topic}</h4>
                    <div className="topic-stats">
                      <div className="topic-percentage">{progress.percentage}%</div>
                      <div className="topic-skill-level">{progress.skillLevel}</div>
                    </div>
                    <div className="topic-progress-bar">
                      <div 
                        className="topic-progress-fill"
                        style={{ width: `${progress.percentage}%` }}
                      ></div>
                    </div>
                    <p className="topic-attempts">{progress.attempts} attempts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Learning Roadmap */}
          {(roadmap.readyFor.length > 0 || roadmap.learnNext.length > 0) && (
            <div className="profile-section card">
              <h2>Learning Roadmap</h2>
              
              {roadmap.readyFor.length > 0 && (
                <div className="roadmap-section">
                  <h4 style={{ color: 'var(--success)' }}>Ready For:</h4>
                  <ul>{roadmap.readyFor.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}

              {roadmap.learnNext.length > 0 && (
                <div className="roadmap-section" style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: 'var(--warning)' }}>Learn Next:</h4>
                  <ul style={{ listStyleType: 'decimal', paddingLeft: '1.5rem' }}>
                    {roadmap.learnNext.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}

              {roadmap.notReadyFor.length > 0 && (
                <div className="roadmap-section" style={{ marginTop: '1rem' }}>
                  <h4 style={{ color: 'var(--danger)' }}>Not Ready For:</h4>
                  <ul style={{ color: 'var(--text-muted)' }}>{roadmap.notReadyFor.map((r, i) => <li key={i}>{r}</li>)}</ul>
                </div>
              )}
            </div>
          )}

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="profile-section card">
              <h2>Achievements</h2>
              <div className="achievements-grid">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className={`achievement-card card-elevated ${achievement.tier}`}>
                    <div className="achievement-icon">{achievement.icon}</div>
                    <div className="achievement-content">
                      <h4>{achievement.title}</h4>
                      <p>{achievement.description}</p>
                      <span className="achievement-date">
                        Unlocked {formatDate(achievement.unlockedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default ProfilePage;