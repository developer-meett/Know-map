import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';

// ─── XP helper ────────────────────────────────────────────────────────────────
const calcXP = (percentage, isPerfect) => {
  let xp = Math.round(percentage * 10); // 0–1000 base
  if (isPerfect) xp += 200;             // perfect-score bonus
  return xp;
};

// ─── submitAttempt ────────────────────────────────────────────────────────────
/**
 * POST /api/attempts
 * Protected — submit a completed quiz attempt and receive analytics.
 *
 * Body: {
 *   quizId,
 *   answers,           // { "0": 2, "1": 0, ... }
 *   timeSpent,         // seconds
 *   deviceType?,
 *   retryAttempt?
 * }
 */
export const submitAttempt = async (req, res) => {
  try {
    const { quizId, answers = {}, timeSpent = 0, deviceType = 'unknown', retryAttempt = 1 } = req.body;

    if (!quizId) {
      return res.status(400).json({ success: false, message: 'quizId is required.' });
    }

    // ── Fetch quiz ────────────────────────────────────────────────────────────
    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
    }

    const totalQuestions = quiz.questions.length;

    // ── Grade answers & build breakdowns ──────────────────────────────────────
    let score = 0;
    const questionBreakdown = [];
    const topicBreakdown    = {};   // { [topic]: { correct, total } }

    quiz.questions.forEach((q, i) => {
      const chosen   = answers[String(i)];
      const isCorrect = chosen === q.correct;
      if (isCorrect) score++;

      questionBreakdown.push({
        index:       i,
        question:    q.question,
        topic:       q.topic,
        chosen,
        correct:     q.correct,
        isCorrect,
        explanation: q.explanation ?? null,
      });

      if (!topicBreakdown[q.topic]) {
        topicBreakdown[q.topic] = { correct: 0, total: 0 };
      }
      topicBreakdown[q.topic].total++;
      if (isCorrect) topicBreakdown[q.topic].correct++;
    });

    const percentage    = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const isPerfectScore = score === totalQuestions && totalQuestions > 0;
    const xpEarned      = calcXP(percentage, isPerfectScore);

    // ── Persist attempt ───────────────────────────────────────────────────────
    const attempt = await QuizAttempt.create({
      userId:   req.user.userId,
      quizId,
      quizTitle:        quiz.title,
      answers,
      score,
      totalQuestions,
      percentage,
      isPerfectScore,
      topicBreakdown,
      questionBreakdown,
      timeSpent,
      deviceType,
      xpEarned,
      retryAttempt,
    });

    // ── Update user stats ─────────────────────────────────────────────────────
    await User.findByIdAndUpdate(req.user.userId, {
      $inc: {
        'stats.totalQuizzesTaken': 1,
        'stats.totalTimeSpent':    Math.round(timeSpent / 60), // convert to minutes
        'stats.totalXP':           xpEarned,
        'stats.perfectScores':     isPerfectScore ? 1 : 0,
      },
    });

    // Recalculate averageScore separately (requires current value)
    const user = await User.findById(req.user.userId).select('stats').lean();
    const newAvg = Math.round(
      ((user.stats.averageScore * (user.stats.totalQuizzesTaken - 1)) + percentage) /
      user.stats.totalQuizzesTaken
    );
    await User.findByIdAndUpdate(req.user.userId, {
      $set: { 'stats.averageScore': newAvg },
    });

    return res.status(201).json({ success: true, attempt });
  } catch (err) {
    console.error('[submitAttempt]', err);
    return res.status(500).json({ success: false, message: 'Server error submitting attempt.' });
  }
};

// ─── getMyAttempts ────────────────────────────────────────────────────────────
/**
 * GET /api/attempts/me
 * Protected — returns all attempts for the authenticated user, newest first.
 */
export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user.userId })
      .sort({ completedAt: -1 })
      .lean();

    return res.status(200).json({ success: true, attempts });
  } catch (err) {
    console.error('[getMyAttempts]', err);
    return res.status(500).json({ success: false, message: 'Server error fetching attempts.' });
  }
};

// ─── getAttemptById ───────────────────────────────────────────────────────────
/**
 * GET /api/attempts/:id
 * Protected — a user can only view their own attempt; admins can view any.
 */
export const getAttemptById = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id).lean();

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found.' });
    }

    // Ownership check
    if (!req.user.isAdmin && String(attempt.userId) !== String(req.user.userId)) {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }

    return res.status(200).json({ success: true, attempt });
  } catch (err) {
    console.error('[getAttemptById]', err);
    return res.status(500).json({ success: false, message: 'Server error fetching attempt.' });
  }
};

// ─── getAllAttempts (admin) ────────────────────────────────────────────────────
/**
 * GET /api/attempts
 * Admin only — paginated list of all attempts across all users.
 * Query params: page (default 1), limit (default 20)
 */
export const getAllAttempts = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      QuizAttempt.find().sort({ completedAt: -1 }).skip(skip).limit(limit).lean(),
      QuizAttempt.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      total,
      page,
      pages: Math.ceil(total / limit),
      attempts,
    });
  } catch (err) {
    console.error('[getAllAttempts]', err);
    return res.status(500).json({ success: false, message: 'Server error fetching attempts.' });
  }
};
