import { Request, Response } from 'express';
import RemedialClass from '../models/RemedialClass';

export const getRemedialClasses = async (req: Request, res: Response) => {
    try {
        const classes = await RemedialClass.findAll();
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching remedial classes', error });
    }
};

export const createRemedialClass = async (req: Request, res: Response) => {
    try {
        const newClass = await RemedialClass.create(req.body);
        res.status(201).json(newClass);
    } catch (error) {
        res.status(400).json({ message: 'Error creating class', error });
    }
};
