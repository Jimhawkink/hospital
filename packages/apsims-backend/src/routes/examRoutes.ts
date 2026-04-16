import { Router } from 'express';
import {
    getExamTypes,
    createExamType,
    getGradingSystem,
    createGrading,
    enterMarks,
    getStudentResults
} from '../controllers/examController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Configuration
router.get('/types', authenticateToken, getExamTypes);
router.post('/types', authenticateToken, createExamType);
router.get('/grading', authenticateToken, getGradingSystem);
router.post('/grading', authenticateToken, createGrading);

// Marks & Results
router.post('/marks', authenticateToken, enterMarks);
router.get('/student/:studentId', authenticateToken, getStudentResults);

export default router;
