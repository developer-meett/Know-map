import { Router } from 'express';
import { getUserReports, getReportById } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/',    protect, getUserReports);
router.get('/:id', protect, getReportById);

export default router;
