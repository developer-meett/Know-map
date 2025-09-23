/**
 * User Profile Data Structure and API
 * 
 * This file defines the data structures for user profiles, quiz history,
 * achievements, and learning analytics in the KnowMap quiz app.
 */

// === USER PROFILE SCHEMA ===

export const UserProfileSchema = {
  // Basic profile info (extends existing user document)
  profile: {
    uid: 'string',
    email: 'string', 
    displayName: 'string',
    photoURL: 'string?',
    bio: 'string?',
    joinedAt: 'timestamp',
    lastActiveAt: 'timestamp',
    isAdmin: 'boolean',
    
    // Profile settings
    preferences: {
      emailNotifications: 'boolean',
      reminderFrequency: 'string', // 'daily', 'weekly', 'none'
      difficultyPreference: 'string', // 'beginner', 'intermediate', 'advanced', 'adaptive'
      favoriteTopics: 'string[]',
      theme: 'string' // 'light', 'dark', 'auto'
    },
    
    // Gamification stats
    stats: {
      totalQuizzesTaken: 'number',
      totalTimeSpent: 'number', // in minutes
      currentStreak: 'number',
      longestStreak: 'number',
      totalXP: 'number',
      level: 'number',
      averageScore: 'number',
      perfectScores: 'number'
    }
  }
};

// === QUIZ HISTORY SCHEMA ===

export const QuizAttemptSchema = {
  // Collection: 'quiz-attempts'
  id: 'string', // auto-generated
  userId: 'string',
  quizId: 'string',
  quizTitle: 'string',
  
  // Attempt details
  startedAt: 'timestamp',
  completedAt: 'timestamp',
  timeSpent: 'number', // in seconds
  
  // Results
  score: 'number',
  totalQuestions: 'number',
  percentage: 'number',
  isPerfectScore: 'boolean',
  
  // Detailed performance
  topicBreakdown: {
    topicName: {
      correct: 'number',
      total: 'number',
      percentage: 'number',
      classification: 'string' // 'Mastered', 'Needs Revision', 'Learn from Scratch'
    }
  },
  
  // Individual answers for review
  questionBreakdown: [{
    questionId: 'string',
    questionText: 'string',
    topic: 'string',
    userAnswer: 'number',
    correctAnswer: 'number',
    isCorrect: 'boolean',
    timeSpent: 'number',
    options: 'string[]'
  }],
  
  // Analytics
  difficultyLevel: 'string',
  deviceType: 'string', // 'mobile', 'tablet', 'desktop'
  retryAttempt: 'number', // 1 for first attempt, 2+ for retries
  
  // Learning impact
  xpEarned: 'number',
  badgesUnlocked: 'string[]',
  streakDay: 'number'
};

// === ACHIEVEMENTS SCHEMA ===

export const AchievementSchema = {
  // Collection: 'achievements' (global achievements definitions)
  id: 'string',
  title: 'string',
  description: 'string',
  iconUrl: 'string',
  category: 'string', // 'streak', 'score', 'topic', 'completion', 'speed'
  tier: 'string', // 'bronze', 'silver', 'gold', 'platinum'
  
  // Unlock criteria
  criteria: {
    type: 'string', // 'quiz_count', 'perfect_scores', 'streak_days', 'topic_mastery'
    value: 'number',
    topicSpecific: 'string?' // specific topic if applicable
  },
  
  // Rewards
  xpReward: 'number',
  rarity: 'string' // 'common', 'rare', 'epic', 'legendary'
};

export const UserAchievementSchema = {
  // Collection: 'user-achievements'
  id: 'string',
  userId: 'string',
  achievementId: 'string',
  unlockedAt: 'timestamp',
  
  // Achievement snapshot (in case global achievement changes)
  achievementSnapshot: AchievementSchema
};

// === LEARNING ANALYTICS SCHEMA ===

export const TopicProgressSchema = {
  // Collection: 'topic-progress'
  id: 'string', // userId_topicName
  userId: 'string',
  topicName: 'string',
  
  // Progress tracking
  skillLevel: 'string', // 'beginner', 'intermediate', 'advanced', 'expert'
  masteryPercentage: 'number', // 0-100
  
  // Performance history
  attempts: 'number',
  averageScore: 'number',
  bestScore: 'number',
  recentScores: 'number[]', // last 10 scores
  
  // Learning path
  recommendedQuizzes: 'string[]',
  completedQuizzes: 'string[]',
  
  // Time tracking
  firstAttemptAt: 'timestamp',
  lastAttemptAt: 'timestamp',
  totalTimeSpent: 'number',
  
  // Improvement metrics
  improvementRate: 'number', // percentage improvement over time
  consistencyScore: 'number', // how consistent their performance is
  
  // Next steps
  nextMilestone: {
    description: 'string',
    targetScore: 'number',
    estimatedQuizzes: 'number'
  }
};

// === DAILY ANALYTICS SCHEMA ===

export const DailyStatsSchema = {
  // Collection: 'daily-stats'
  id: 'string', // userId_YYYY-MM-DD
  userId: 'string',
  date: 'string', // YYYY-MM-DD format
  
  // Daily activity
  quizzesTaken: 'number',
  questionsAnswered: 'number',
  timeSpent: 'number', // in minutes
  xpEarned: 'number',
  
  // Performance
  averageScore: 'number',
  perfectScores: 'number',
  topicsStudied: 'string[]',
  
  // Streak tracking
  isStreakDay: 'boolean',
  streakDayNumber: 'number'
};

// === API ENDPOINTS STRUCTURE ===

export const ProfileAPI = {
  // GET /api/profile/:userId
  getProfile: 'Return complete user profile with stats',
  
  // PUT /api/profile/:userId
  updateProfile: 'Update profile information and preferences',
  
  // GET /api/profile/:userId/history
  getQuizHistory: 'Return paginated quiz attempt history',
  
  // GET /api/profile/:userId/achievements
  getAchievements: 'Return unlocked achievements and progress toward others',
  
  // GET /api/profile/:userId/analytics
  getAnalytics: 'Return learning analytics and progress data',
  
  // GET /api/profile/:userId/recommendations
  getRecommendations: 'Return personalized quiz recommendations',
  
  // POST /api/profile/:userId/set-goal
  setLearningGoal: 'Set learning goals and targets'
};

// === FIRESTORE COLLECTION STRUCTURE ===

export const FirestoreCollections = {
  'users': 'Extended with profile, stats, preferences',
  'quiz-attempts': 'Individual quiz attempt records',
  'achievements': 'Global achievement definitions',
  'user-achievements': 'User-specific achievement unlocks',
  'topic-progress': 'Per-topic learning progress',
  'daily-stats': 'Daily activity and performance stats',
  'learning-goals': 'User-set learning objectives',
  'notifications': 'User notifications and reminders'
};

// === COMPONENT STRUCTURE ===

export const ComponentStructure = {
  pages: [
    'ProfilePage.jsx - Main profile overview',
    'QuizHistoryPage.jsx - Detailed quiz history',
    'AchievementsPage.jsx - Badges and achievements',
    'AnalyticsPage.jsx - Learning analytics dashboard',
    'SettingsPage.jsx - Profile and app settings'
  ],
  
  components: [
    'ProfileCard.jsx - User info summary card',
    'StatsOverview.jsx - Key statistics display',
    'QuizAttemptCard.jsx - Individual quiz attempt',
    'AchievementBadge.jsx - Achievement display',
    'ProgressChart.jsx - Learning progress visualization',
    'RecommendationCard.jsx - Recommended quiz',
    'StreakCounter.jsx - Daily streak display',
    'TopicProgress.jsx - Topic-specific progress'
  ]
};