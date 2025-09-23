import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [topicProgress, setTopicProgress] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchRecentAttempts();
      fetchTopicProgress();
      fetchAchievements();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Ensure stats object exists with defaults
        const defaultStats = {
          totalQuizzesTaken: 0,
          totalTimeSpent: 0,
          totalXP: 0,
          level: 1,
          averageScore: 0,
          perfectScores: 0
        };
        
        setUserProfile({
          ...userData,
          stats: { ...defaultStats, ...(userData.stats || {}) }
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile data');
    }
  };

  const fetchRecentAttempts = async () => {
    try {
      console.log('📊 Fetching recent attempts for user:', user.uid);
      
      // First, try to get ALL quiz-attempts for this user (without orderBy to avoid index issues)
      const attemptsQuery = query(
        collection(db, 'quiz-attempts'),
        where('userId', '==', user.uid)
      );
      
      const snapshot = await getDocs(attemptsQuery);
      console.log('📊 Found', snapshot.size, 'quiz attempts in quiz-attempts collection');
      
      let attempts = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📊 Quiz attempt data:', data);
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Sort manually and limit to 5
      attempts = attempts
        .sort((a, b) => {
          const dateA = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt);
          const dateB = b.completedAt?.toDate ? b.completedAt.toDate() : new Date(b.completedAt);
          return dateB - dateA;
        })
        .slice(0, 5);
      
      console.log('📊 Sorted recent attempts:', attempts);
      setRecentAttempts(attempts);
      
    } catch (error) {
      console.error('❌ Error fetching quiz-attempts:', error);
      // Fallback to legacy reports collection
      try {
        console.log('📊 Trying legacy reports collection...');
        
        // Try without orderBy first to avoid index issues
        const reportsQuery = query(
          collection(db, 'reports'),
          where('userId', '==', user.uid)
        );
        
        const snapshot = await getDocs(reportsQuery);
        console.log('📊 Found', snapshot.size, 'reports in legacy collection');
        
        let reports = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('📊 Report data:', data);
          return {
            id: doc.id,
            quizTitle: data.quizTitle,
            completedAt: data.submittedAt,
            score: data.analysis?.totalScore || 0,
            totalQuestions: data.analysis?.totalQuestions || 0,
            percentage: data.analysis?.overallPercentage || 0,
            isPerfectScore: (data.analysis?.overallPercentage || 0) === 100
          };
        });
        
        // Sort manually and limit to 5
        reports = reports
          .sort((a, b) => {
            const dateA = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt);
            const dateB = b.completedAt?.toDate ? b.completedAt.toDate() : new Date(b.completedAt);
            return dateB - dateA;
          })
          .slice(0, 5);
        
        console.log('📊 Sorted legacy reports:', reports);
        setRecentAttempts(reports);
        
      } catch (legacyError) {
        console.error('❌ Error fetching legacy reports:', legacyError);
        setRecentAttempts([]); // Set empty array instead of leaving undefined
      }
    }
  };

  const fetchTopicProgress = async () => {
    try {
      // This would fetch from topic-progress collection in a real implementation
      // For now, analyze recent attempts to show topic breakdown
      const topicStats = {};
      
      recentAttempts.forEach(attempt => {
        if (attempt.topicBreakdown) {
          Object.entries(attempt.topicBreakdown).forEach(([topic, stats]) => {
            if (!topicStats[topic]) {
              topicStats[topic] = { correct: 0, total: 0, attempts: 0 };
            }
            topicStats[topic].correct += stats.correct;
            topicStats[topic].total += stats.total;
            topicStats[topic].attempts += 1;
          });
        }
      });
      
      // Calculate percentages and skill levels
      Object.keys(topicStats).forEach(topic => {
        const stats = topicStats[topic];
        stats.percentage = Math.round((stats.correct / stats.total) * 100);
        stats.skillLevel = getSkillLevel(stats.percentage);
      });
      
      setTopicProgress(topicStats);
    } catch (error) {
      console.error('Error calculating topic progress:', error);
    }
  };

  const fetchAchievements = async () => {
    try {
      // This would fetch actual achievements in a real implementation
      // For now, calculate some basic achievements based on user stats
      const userStats = userProfile?.stats || {};
      const calculatedAchievements = [];
      
      // First Quiz achievement
      if (userStats.totalQuizzesTaken >= 1) {
        calculatedAchievements.push({
          id: 'first-quiz',
          title: 'Getting Started',
          description: 'Completed your first quiz',
          icon: '🎯',
          unlockedAt: new Date(),
          tier: 'bronze'
        });
      }
      
      // Perfect Score achievement
      if (userStats.perfectScores >= 1) {
        calculatedAchievements.push({
          id: 'perfect-score',
          title: 'Perfectionist',
          description: 'Achieved a perfect score',
          icon: '🏆',
          unlockedAt: new Date(),
          tier: 'gold'
        });
      }
      
      // Quiz Master achievement
      if (userStats.totalQuizzesTaken >= 10) {
        calculatedAchievements.push({
          id: 'quiz-master',
          title: 'Quiz Master',
          description: 'Completed 10 quizzes',
          icon: '🧠',
          unlockedAt: new Date(),
          tier: 'silver'
        });
      }
      
      setAchievements(calculatedAchievements);
    } catch (error) {
      console.error('Error calculating achievements:', error);
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    
    // Handle Firestore timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      <div className="profile-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <h3>Error Loading Profile</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const stats = userProfile?.stats || {};

  return (
    <div className="profile-page">
      {/* Back Button */}
      <div className="profile-header-nav">
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>

      {/* Profile Header */}
      <div className="profile-header">
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
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{stats.totalQuizzesTaken}</h3>
            <p>Quizzes Completed</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.averageScore}%</h3>
            <p>Average Score</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-content">
            <h3>{formatTime(stats.totalTimeSpent)}</h3>
            <p>Time Spent</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <h3>{stats.perfectScores}</h3>
            <p>Perfect Scores</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="section">
        <h2>Recent Quiz Attempts</h2>
        {recentAttempts.length > 0 ? (
          <div className="recent-attempts">
            {recentAttempts.map((attempt) => (
              <div key={attempt.id} className="attempt-card">
                <div className="attempt-header">
                  <h4>{attempt.quizTitle}</h4>
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

      {/* Topic Progress */}
      {Object.keys(topicProgress).length > 0 && (
        <div className="section">
          <h2>Topic Progress</h2>
          <div className="topic-grid">
            {Object.entries(topicProgress).map(([topic, progress]) => (
              <div key={topic} className="topic-card">
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

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="section">
          <h2>Achievements</h2>
          <div className="achievements-grid">
            {achievements.map((achievement) => (
              <div key={achievement.id} className={`achievement-card ${achievement.tier}`}>
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
  );
};

export default ProfilePage;