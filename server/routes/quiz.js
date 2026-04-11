import { Router } from 'express';
import {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
} from '../controllers/quizController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = Router();

// Public
router.get('/',    getQuizzes);
router.get('/:id', getQuizById);

// Admin only
router.post('/',      protect, adminOnly, createQuiz);
router.put('/:id',    protect, adminOnly, updateQuiz);
router.delete('/:id', protect, adminOnly, deleteQuiz);

export default router;
