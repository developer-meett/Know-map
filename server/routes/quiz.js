import { Router } from 'express';
import {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  submitQuiz,
} from '../controllers/quizController.js';
import { protect, adminOnly, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Admin
router.post('/',       protect, adminOnly, createQuiz);
router.put('/:id',     protect, adminOnly, updateQuiz);
router.delete('/:id',  protect, adminOnly, deleteQuiz);

// Public
router.get('/',    getQuizzes);

// Protected / OptionalAuth
router.get('/:id', optionalAuth, getQuizById);
router.post('/:id/submit', protect, submitQuiz);

export default router;
