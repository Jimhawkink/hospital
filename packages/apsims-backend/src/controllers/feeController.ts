import { Request, Response } from 'express';
import FeeStructure from '../models/FeeStructure';
import FeePayment from '../models/FeePayment';
import Student from '../models/Student';
import { Op } from 'sequelize';

// --- Fee Structure ---
export const setFeeStructure = async (req: Request, res: Response) => {
    try {
        const structure = await FeeStructure.create(req.body);
        res.status(201).json(structure);
    } catch (error) {
        res.status(400).json({ message: 'Error creating fee structure', error });
    }
};

export const getFeeStructure = async (req: Request, res: Response) => {
    try {
        const { term, year } = req.query;
        // If term/year provided, filter, else get all (or latest)
        const whereClause: any = {};
        if (term) whereClause.term = term;
        if (year) whereClause.year = year;

        const structures = await FeeStructure.findAll({ where: whereClause });
        res.json(structures);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching fee structures', error });
    }
};

// --- Payments ---
export const receivePayment = async (req: Request, res: Response) => {
    try {
        const payment = await FeePayment.create(req.body);
        res.status(201).json(payment);
    } catch (error) {
        res.status(400).json({ message: 'Error recording payment', error });
    }
};

export const getStudentPayments = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const payments = await FeePayment.findAll({ where: { student_id: studentId } });
        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching payments', error });
    }
};

// --- Balances ---
export const getFeeBalances = async (req: Request, res: Response) => {
    /* 
       Logic:
       1. Get all students.
       2. For each student, calculate Total Billed (based on their class history? simplified: current class * terms).
       3. Calculate Total Paid.
       4. Balance = Billed - Paid.
       
       *Simplified Version for MVP:*
       - Assume current class fees apply for previous terms if not tracked? 
       - Or just Sum of all FeeStructures matching student's current class? (This is flawed if they moved classes).
       - BETTER: Just sum all FeeStructures (if global) or by Student's current class for current year.
       
       Let's implement: "Current Term Balance"
       - Get FeeStructure for current term & student's class.
       - Get Payments for current term (or all time if carrying forward arrears).
       
       Let's do: Total Outstanding Balance (All Time).
       - Total Billed matches Student Class Level... wait, we need student class history for perfect billing.
       - For now: We will just return list of students and their Total Payments vs a "Target" or just Total Payments.
    */

    try {
        const students = await Student.findAll();
        const payments = await FeePayment.findAll();
        const structures = await FeeStructure.findAll();

        // Map payments by student
        const paymentsMap: Record<number, number> = {};
        payments.forEach(p => {
            paymentsMap[p.student_id] = (paymentsMap[p.student_id] || 0) + p.amount;
        });

        // Calculate billed amount for a "Form 1" student? 
        // For MVP, lets just show Total Paid and let admin deduct from known fees.
        // OR: allow filtering by Class.
        // If I filter by Form 1, I know the fee is X.

        const balances = students.map(student => {
            const paid = paymentsMap[student.id] || 0;
            // Find applicable fee structure for this student's current class/term
            // This is tricky without knowing exactly "which" terms they attended.
            // We will rely on Frontend to display "Expected: X, Paid: Y".
            return {
                student,
                paid,
                // balance: ??? 
            };
        });

        res.json(balances);

    } catch (error) {
        res.status(500).json({ message: 'Error calculating balances', error });
    }
};
