import { Router } from 'express';
import { getTimetable, createSlot, generateTimetable } from '../controllers/timetableController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getTimetable);
router.post('/', authenticateToken, createSlot);
router.post('/generate', authenticateToken, generateTimetable);

export default router;
