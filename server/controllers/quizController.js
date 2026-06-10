import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import UserTopicProgress from '../models/UserTopicProgress.js';
import UserQuestionHistory from '../models/UserQuestionHistory.js';
import { analyzeQuizPerformance } from '../utils/quizAnalyzer.js';
import { generateQuizForUser, cleanAndShuffleQuestions } from '../utils/quizGenerator.js';

// ─── getQuizzes ───────────────────────────────────────────────────────────────
/**
 * GET /api/quizzes
 * Public — returns all published quizzes (questions omitted for list view).
 */
export const getQuizzes = async (_req, res) => {
  try {
    const quizzesData = await Quiz.find({ isPublished: true })
      .select('title description difficulty createdAt questions')
      .sort({ createdAt: -1 })
      .lean();

    const quizzes = quizzesData.map(q => {
      const { questions, ...rest } = q;
      return {
        ...rest,
        questionCount: questions ? questions.length : 0
      };
    });

    return res.status(200).json({ success: true, quizzes });
  } catch (err) {
    console.error('[getQuizzes]', err);
    return res.status(500).json({ success: false, message: 'Server error fetching quizzes.' });
  }
};

// ─── getQuizById ──────────────────────────────────────────────────────────────
/**
 * GET /api/quizzes/:id
 * Public — returns full quiz including questions (correct answers included
 * for now; strip on the client or behind protect if needed later).
 */
export const getQuizById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz ID format.' });
    }

    let quiz = await Quiz.findOne({ _id: req.params.id }).lean();

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    if (req.user && req.user.userId) {
      quiz.questions = await generateQuizForUser(req.user.userId, quiz._id, 5);
    } else {
      let questions = [...quiz.questions];
      questions.sort(() => Math.random() - 0.5);
      quiz.questions = cleanAndShuffleQuestions(questions.slice(0, 5));
    }

    return res.status(200).json({ success: true, quiz });
  } catch (err) {
    console.error('[getQuizById]', err);
    return res.status(500).json({ success: false, message: 'Server error fetching quiz.' });
  }
};

// ─── createQuiz ───────────────────────────────────────────────────────────────
/**
 * POST /api/quizzes
 * Admin only — create a new quiz.
 * Body: { title, description?, difficulty?, questions?, isPublished? }
 */
export const createQuiz = async (req, res) => {
  try {
    const { title, description, difficulty, questions, isPublished } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'title is required.' });
    }
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Questions array cannot be empty.' });
    }

    const quiz = await Quiz.create({
      title,
      description:  description  ?? null,
      difficulty:   difficulty   ?? 'medium',
      questions:    questions    ?? [],
      isPublished:  isPublished  ?? true,
      createdBy:    req.user.userId,
    });

    return res.status(201).json({ success: true, quiz });
  } catch (err) {
    console.error('[createQuiz]', err);
    return res.status(500).json({ success: false, message: 'Server error creating quiz.' });
  }
};

// ─── updateQuiz ───────────────────────────────────────────────────────────────
/**
 * PUT /api/quizzes/:id
 * Admin only — update any top-level quiz field.
 */
export const updateQuiz = async (req, res) => {
  try {
    const allowed = ['title', 'description', 'difficulty', 'questions', 'isPublished'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const quiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    return res.status(200).json({ success: true, quiz });
  } catch (err) {
    console.error('[updateQuiz]', err);
    return res.status(500).json({ success: false, message: 'Server error updating quiz.' });
  }
};

// ─── deleteQuiz ───────────────────────────────────────────────────────────────
/**
 * DELETE /api/quizzes/:id
 * Admin only — permanently remove a quiz.
 */
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    return res.status(200).json({ success: true, message: 'Quiz deleted.' });
  } catch (err) {
    console.error('[deleteQuiz]', err);
    return res.status(500).json({ success: false, message: 'Server error deleting quiz.' });
  }
};

// ─── submitQuiz ───────────────────────────────────────────────────────────────
/**
 * POST /api/quizzes/:id/submit
 * Protected — submit answers, run analysis, persist attempt, update user stats.
 *
 * Body: { answers, timeSpent, deviceType }
 * Returns: { success, reportId, attemptId, analysis, xpEarned, isPerfectScore, message }
 */
export const submitQuiz = async (req, res) => {
  try {
    // 1. Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid quiz ID format.' });
    }

    // 2. Fetch quiz
    const quiz = await Quiz.findById(req.params.id).lean();
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    // 3. Parse body
    const { answers = {}, timeSpent = 0, deviceType = 'unknown' } = req.body;

    // 4. Validate answers
    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return res.status(400).json({ success: false, message: 'answers object is required and must not be empty.' });
    }

    // Ensure all DB questions have an ID so filtering works for legacy imported quizzes
    if (quiz.questions) {
      quiz.questions.forEach((q, i) => {
        if (!q.id && !q._id) q.id = `q${i}`;
      });
    }

    // Filter questions to only the ones actually answered (id-based mapping)
    const answeredKeys = Object.keys(answers);
    const isIdBased = answeredKeys.some(k => isNaN(k));

    let questionsToGrade = quiz.questions;
    if (isIdBased) {
      const dbQuestionsMap = {};
      quiz.questions.forEach(q => {
         const qid = (q._id && q._id.toString()) || q.id;
         dbQuestionsMap[qid] = q;
      });
      questionsToGrade = answeredKeys.map(qid => dbQuestionsMap[qid]).filter(Boolean);
    } else {
      // Legacy fallback
      if (answeredKeys.length < quiz.questions.length) {
         questionsToGrade = quiz.questions.slice(0, answeredKeys.length);
      }
    }

    // 5. Fetch historical question counts for confidence calculation
    const historicalProgress = await UserTopicProgress.find({ userId: req.user.userId }).lean();
    const historicalCounts = {};
    for (const hp of historicalProgress) {
        historicalCounts[hp.topic] = (historicalCounts[hp.topic] || 0) + hp.questionsAnswered;
        historicalCounts[`${hp.topic}::${hp.subtopic}`] = (historicalCounts[`${hp.topic}::${hp.subtopic}`] || 0) + hp.questionsAnswered;
    }

    // 5b. Run analysis using the ported quizAnalyzer utility
    const analysis = analyzeQuizPerformance(answers, questionsToGrade, historicalCounts);
    const { totalScore, totalQuestions, overallPercentage, classifiedTopics, questionBreakdown } = analysis;

    // 6. Calculate derived metrics
    const isPerfectScore = overallPercentage === 100;
    const xpEarned = 10 + (totalScore * 2) + (isPerfectScore ? 50 : 0);

    // 7. Persist QuizAttempt
    const attempt = await QuizAttempt.create({
      userId:            req.user.userId,
      quizId:            quiz._id,
      answers,
      score:             totalScore,
      totalQuestions,
      percentage:        overallPercentage,
      isPerfectScore,
      topicBreakdown:    classifiedTopics,
      questionBreakdown,
      timeSpent,
      deviceType,
      xpEarned,
    });

    // 7b. Persist UserTopicProgress
    const topicProgressDocs = [];
    for (const [topic, topicData] of Object.entries(classifiedTopics)) {
        for (const [subtopic, subtopicData] of Object.entries(topicData.subtopics)) {
            topicProgressDocs.push({
                userId: req.user.userId,
                subject: 'General',
                topic,
                subtopic,
                score: subtopicData.percentage,
                classification: subtopicData.classification,
                confidence: subtopicData.confidence,
                questionsAnswered: subtopicData.questionsAnswered,
                quizAttemptId: attempt._id
            });
        }
    }
    if (topicProgressDocs.length > 0) {
        await UserTopicProgress.insertMany(topicProgressDocs).catch(e => console.error("[submitQuiz] Failed to insert UserTopicProgress", e));
    }

    // 7c. Persist UserQuestionHistory
    const historyDocs = [];
    for (const q of questionBreakdown) {
        historyDocs.push({
            userId: req.user.userId,
            questionId: q.questionId
        });
    }
    if (historyDocs.length > 0) {
        await UserQuestionHistory.insertMany(historyDocs).catch(e => console.error("[submitQuiz] Failed to insert UserQuestionHistory", e));
    }

    // 8. Update user stats — fire-and-forget pattern (failure must NOT fail the request)
    try {
      // Atomic increments first
      await User.findByIdAndUpdate(req.user.userId, {
        $inc: {
          'stats.totalQuizzesTaken': 1,
          'stats.totalXP':           xpEarned,
          'stats.totalTimeSpent':    Math.round(timeSpent / 60),
          'stats.perfectScores':     isPerfectScore ? 1 : 0,
        },
      });

      // Recalculate averageScore and level after increment
      const updated = await User.findById(req.user.userId).select('stats').lean();
      const taken = updated.stats.totalQuizzesTaken;
      const prevAvg = updated.stats.averageScore ?? 0;
      const newAvg = Math.round(((prevAvg * (taken - 1)) + overallPercentage) / taken);
      const newLevel = Math.max(1, Math.floor(updated.stats.totalXP / 100));

      await User.findByIdAndUpdate(req.user.userId, {
        $set: {
          'stats.averageScore': newAvg,
          'stats.level':        newLevel,
        },
      });
    } catch (statsErr) {
      console.warn('[submitQuiz] Non-fatal: failed to update user stats:', statsErr.message);
    }

    // 9. Return response matching the frontend Results.jsx contract exactly
    return res.status(200).json({
      success:       true,
      reportId:      attempt._id,
      attemptId:     attempt._id,
      analysis,
      xpEarned,
      isPerfectScore,
      message:       isPerfectScore
        ? '🎉 Perfect score! Amazing work!'
        : `Quiz completed! You scored ${totalScore}/${totalQuestions}.`,
    });
  } catch (err) {
    console.error('[submitQuiz]', err);
    return res.status(500).json({ success: false, message: 'Server error submitting quiz.' });
  }
};
