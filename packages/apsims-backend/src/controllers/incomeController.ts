import { Request, Response } from 'express';
import Income from '../models/Income';
import { Op } from 'sequelize';

// Get all income
export const getAllIncome = async (req: Request, res: Response) => {
    try {
        const income = await Income.findAll({ order: [['date', 'DESC']] });
        res.json(income);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching income records', error });
    }
};

// Record new income
export const recordIncome = async (req: Request, res: Response) => {
    try {
        const newIncome = await Income.create(req.body);
        res.status(201).json(newIncome);
    } catch (error) {
        res.status(400).json({ message: 'Error recording income', error });
    }
};

// Get income summary (e.g., by month) - Basic implementation
export const getIncomeSummary = async (req: Request, res: Response) => {
    try {
        const totalIncome = await Income.sum('amount');
        res.json({ total: totalIncome });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching summary', error });
    }
};
