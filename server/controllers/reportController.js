import QuizAttempt from '../models/QuizAttempt.js';
import UserTopicProgress from '../models/UserTopicProgress.js';

// ─── getUserReports ───────────────────────────────────────────────────────────
/**
 * GET /api/reports
 * Protected — returns all quiz attempts for the authenticated user.
 */
export const getUserReports = async (req, res) => {
  try {
    const reports = await QuizAttempt.find({ userId: req.user.userId })
      .populate('quizId', 'title difficulty')
      .sort({ completedAt: -1 })
      .lean();

    return res.status(200).json({ success: true, reports });
  } catch (err) {
    console.error('[getUserReports]', err);
    return res.status(500).json({ success: false, message: 'Server error fetching reports.' });
  }
};

// ─── getReportById ────────────────────────────────────────────────────────────
/**
 * GET /api/reports/:id
 * Protected — a user can only view their own report; admins can view any.
 */
export const getReportById = async (req, res) => {
  try {
    const report = await QuizAttempt.findById(req.params.id)
      .populate('quizId', 'title difficulty description')
      .lean();

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    // Ownership / admin check
    if (!req.user.isAdmin && String(report.userId) !== String(req.user.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({ success: true, report });
  } catch (err) {
    console.error('[getReportById]', err);
    return res.status(500).json({ success: false, message: 'Server error fetching report.' });
  }
};

// ─── getTrends ───────────────────────────────────────────────────────────────
/**
 * GET /api/reports/trends
 * Protected — returns chronological score trends per topic
 */
export const getTrends = async (req, res) => {
  try {
    const progress = await UserTopicProgress.find({ userId: req.user.userId })
      .sort({ createdAt: 1 })
      .lean();
      
    // Group by topic
    const trends = {};
    for (const p of progress) {
      if (!trends[p.topic]) trends[p.topic] = [];
      trends[p.topic].push({
        date: p.createdAt,
        score: p.score
      });
    }

    return res.status(200).json({ success: true, trends });
  } catch (err) {
    console.error('[getTrends]', err);
    return res.status(500).json({ success: false, message: 'Server error fetching trends.' });
  }
};

// ─── getRoadmap ───────────────────────────────────────────────────────────────
/**
 * GET /api/reports/roadmap
 * Protected — generates actionable learning paths based on latest topic/subtopic progress
 */
export const getRoadmap = async (req, res) => {
  try {
    const progress = await UserTopicProgress.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .lean();

    const latest = {};
    for (const p of progress) {
      const key = `${p.topic}::${p.subtopic}`;
      if (!latest[key]) latest[key] = p;
    }

    const readyFor = [];
    const learnNext = [];
    const notReadyFor = [];

    for (const p of Object.values(latest)) {
      if (p.classification === 'Mastered') {
        readyFor.push(`${p.topic}: ${p.subtopic}`);
      } else if (p.classification === 'Needs Revision') {
        learnNext.push(`${p.topic}: ${p.subtopic}`);
      } else {
        notReadyFor.push(`${p.topic}: ${p.subtopic} (Needs Foundation)`);
        learnNext.push(`${p.topic}: Foundation`);
      }
    }

    const uniqueLearnNext = [...new Set(learnNext)].slice(0, 5);
    const uniqueReadyFor = [...new Set(readyFor)].slice(0, 5);
    const uniqueNotReadyFor = [...new Set(notReadyFor)].slice(0, 5);

    return res.status(200).json({ 
      success: true, 
      roadmap: {
        readyFor: uniqueReadyFor,
        learnNext: uniqueLearnNext,
        notReadyFor: uniqueNotReadyFor
      } 
    });
  } catch (err) {
    console.error('[getRoadmap]', err);
    return res.status(500).json({ success: false, message: 'Server error generating roadmap.' });
  }
};
