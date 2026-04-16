import { Router } from 'express';
import { getDashboardStats } from '../controllers/statsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/dashboard', authenticateToken, getDashboardStats);

export default router;
