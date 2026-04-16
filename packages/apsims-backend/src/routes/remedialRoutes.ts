import { Router } from 'express';
import { getRemedialClasses, createRemedialClass } from '../controllers/remedialController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getRemedialClasses);
router.post('/', authenticateToken, createRemedialClass);

export default router;
