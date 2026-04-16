import { Router } from 'express';
import {
    setFeeStructure,
    getFeeStructure,
    receivePayment,
    getStudentPayments,
    getFeeBalances
} from '../controllers/feeController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Structure
router.post('/structure', authenticateToken, setFeeStructure);
router.get('/structure', authenticateToken, getFeeStructure);

// Payments
router.post('/payments', authenticateToken, receivePayment);
router.get('/payments/:studentId', authenticateToken, getStudentPayments);

// Balances
router.get('/balances', authenticateToken, getFeeBalances);

export default router;
