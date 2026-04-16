import { Router } from 'express';
import { getAllStudents, createStudent, getStudentById, updateStudent, deleteStudent } from '../controllers/studentController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/', authenticateToken, getAllStudents);
router.post('/', authenticateToken, createStudent);
router.get('/:id', authenticateToken, getStudentById);
router.put('/:id', authenticateToken, updateStudent);
router.delete('/:id', authenticateToken, deleteStudent);

export default router;
