import { Router } from 'express';
import { getMyAttempts, getAttemptById } from '../controllers/attemptController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// A user's "reports" are their quiz attempt records
router.get('/',    protect, getMyAttempts);
router.get('/:id', protect, getAttemptById);

export default router;
