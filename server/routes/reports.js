import { Router } from 'express';
import { getUserReports, getReportById, getTrends, getRoadmap } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/trends',  protect, getTrends);
router.get('/roadmap', protect, getRoadmap);
router.get('/',        protect, getUserReports);
router.get('/:id',     protect, getReportById);

export default router;
