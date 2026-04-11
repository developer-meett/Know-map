import { Router } from 'express';
import { listUsers, deleteUser, changeUserRole } from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/users',            protect, adminOnly, listUsers);
router.delete('/users/:id',     protect, adminOnly, deleteUser);
router.patch('/users/:id/role', protect, adminOnly, changeUserRole);

export default router;
