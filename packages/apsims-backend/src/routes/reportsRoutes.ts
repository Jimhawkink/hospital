import { Router } from 'express';
import { generateReportForm, generateFeeReceipt } from '../controllers/reportsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/report-form', authenticateToken, generateReportForm);
router.get('/fee-receipt/:paymentId', authenticateToken, generateFeeReceipt);

export default router;
