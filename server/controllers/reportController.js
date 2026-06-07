import QuizAttempt from '../models/QuizAttempt.js';

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
