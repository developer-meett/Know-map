import { Router } from 'express';
import { getMyProfile, updateMyProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/me',   protect, getMyProfile);
router.patch('/me', protect, updateMyProfile);

export default router;
