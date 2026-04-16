import { Router } from 'express';
import { getAllStaff, createStaff, updateStaff, deleteStaff } from '../controllers/staffController';
import { getAllSubordinateStaff, createSubordinateStaff, updateSubordinateStaff, deleteSubordinateStaff } from '../controllers/subordinateStaffController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Teaching Staff Routes
router.get('/teaching', authenticateToken, getAllStaff);
router.post('/teaching', authenticateToken, createStaff);
router.put('/teaching/:id', authenticateToken, updateStaff);
router.delete('/teaching/:id', authenticateToken, deleteStaff);

// Subordinate Staff Routes
router.get('/subordinate', authenticateToken, getAllSubordinateStaff);
router.post('/subordinate', authenticateToken, createSubordinateStaff);
router.put('/subordinate/:id', authenticateToken, updateSubordinateStaff);
router.delete('/subordinate/:id', authenticateToken, deleteSubordinateStaff);

export default router;
