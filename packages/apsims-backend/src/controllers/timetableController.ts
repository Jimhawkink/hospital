import { Request, Response } from 'express';
import TimetableSlot from '../models/TimetableSlot';

export const getTimetable = async (req: Request, res: Response) => {
    try {
        const { classLevel } = req.query;
        const where: any = {};
        if (classLevel) where.class_level = classLevel;

        const slots = await TimetableSlot.findAll({ where });
        res.json(slots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching timetable', error });
    }
};

export const createSlot = async (req: Request, res: Response) => {
    try {
        const slot = await TimetableSlot.create(req.body);
        res.status(201).json(slot);
    } catch (error) {
        res.status(400).json({ message: 'Error creating timetable slot', error });
    }
};

export const generateTimetable = async (req: Request, res: Response) => {
    // Placeholder for auto-generation logic
    res.json({ message: 'Auto-generation feature coming soon' });
};
