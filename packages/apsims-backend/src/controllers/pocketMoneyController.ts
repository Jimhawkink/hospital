import { Request, Response } from 'express';
import PocketMoneyAccount from '../models/PocketMoneyAccount';

export const getAccount = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const account = await PocketMoneyAccount.findOne({ where: { student_id: studentId } });
        if (!account) {
            // Auto-create if not exists for simplicity
            const newAccount = await PocketMoneyAccount.create({ student_id: studentId, balance: 0 });
            return res.json(newAccount);
        }
        res.json(account);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching account', error });
    }
};

export const deposit = async (req: Request, res: Response) => {
    try {
        const { studentId, amount } = req.body;
        const account = await PocketMoneyAccount.findOne({ where: { student_id: studentId } });

        if (account) {
            account.balance += amount;
            await account.save();
            res.json(account);
        } else {
            const newAccount = await PocketMoneyAccount.create({ student_id: studentId, balance: amount });
            res.json(newAccount);
        }
    } catch (error) {
        res.status(500).json({ message: 'Error depositing funds', error });
    }
};

export const withdraw = async (req: Request, res: Response) => {
    try {
        const { studentId, amount } = req.body;
        const account = await PocketMoneyAccount.findOne({ where: { student_id: studentId } });

        if (account && account.balance >= amount) {
            account.balance -= amount;
            await account.save();
            res.json(account);
        } else {
            res.status(400).json({ message: 'Insufficient funds or account not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error withdrawing funds', error });
    }
};
