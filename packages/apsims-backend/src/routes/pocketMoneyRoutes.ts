import { Router } from 'express';
import { getAccount, deposit, withdraw } from '../controllers/pocketMoneyController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/:studentId', authenticateToken, getAccount);
router.post('/deposit', authenticateToken, deposit);
router.post('/withdraw', authenticateToken, withdraw);

export default router;
