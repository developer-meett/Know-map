import { Router } from 'express';
import {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
} from '../controllers/quizController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = Router();

// Public
router.get('/',    getQuizzes);

// Protected
router.get('/:id', getQuizById);
router.post('/:id/submit', protect, submitQuiz);

// Admin only
router.post('/',      protect, adminOnly, createQuiz);
router.put('/:id',    protect, adminOnly, updateQuiz);
router.delete('/:id', protect, adminOnly, deleteQuiz);

export default router;
