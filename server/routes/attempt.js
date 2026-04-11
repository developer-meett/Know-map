import { Router } from 'express';
import {
  submitAttempt,
  getMyAttempts,
  getAttemptById,
  getAllAttempts,
} from '../controllers/attemptController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = Router();

// All attempt routes require authentication
router.use(protect);

router.post('/',    submitAttempt);   // submit new attempt
router.get('/me',   getMyAttempts);   // my history  (must be before /:id)
router.get('/:id',  getAttemptById);  // single attempt (own or admin)

// Admin only
router.get('/', adminOnly, getAllAttempts); // paginated all attempts

export default router;
