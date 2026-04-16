import { Router } from 'express';
import { getAllIncome, recordIncome, getIncomeSummary } from '../controllers/incomeController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getAllIncome);
router.post('/', authenticateToken, recordIncome);
router.get('/summary', authenticateToken, getIncomeSummary);

export default router;
