import Quiz from '../models/Quiz.js';

// ─── getQuizzes ───────────────────────────────────────────────────────────────
/**
 * GET /api/quizzes
 * Public — returns all published quizzes (questions omitted for list view).
 */
export const getQuizzes = async (_req, res) => {
  try {
    const quizzes = await Quiz.find({ isPublished: true })
      .select('-questions')
      .sort({ createdAt: -1 })
      .lean();

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
    const quiz = await Quiz.findOne({ _id: req.params.id, isPublished: true }).lean();

    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found.' });
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
