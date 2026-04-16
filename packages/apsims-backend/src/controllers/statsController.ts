import { Request, Response } from 'express';
// import Student from '../models/Student'; // We'll uncomment this when we have real data

export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        // Mock data for now, mimicking what the frontend expects
        // In next steps, we will query Student.count(), etc.
        const stats = {
            totalStudents: 1250,
            studentsChange: 12, // +12%
            feesCollected: 4500000,
            feesChange: 8,
            upcomingExams: 3,
            totalIncome: 5200000,
            incomeChange: 23
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
