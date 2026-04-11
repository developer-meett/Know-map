import { Router } from 'express';
import { register, login, googleAuth, logout, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login',    login);
router.post('/google',   googleAuth);
router.post('/logout',   logout);

// Protected route — requires valid JWT cookie
router.get('/me', protect, getMe);

export default router;
