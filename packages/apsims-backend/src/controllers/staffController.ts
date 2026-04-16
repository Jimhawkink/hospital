import { Request, Response } from 'express';
import Staff from '../models/Staff';

// Get all staff
export const getAllStaff = async (req: Request, res: Response) => {
    try {
        const staff = await Staff.findAll();
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving staff', error });
    }
};

// Create new staff
export const createStaff = async (req: Request, res: Response) => {
    try {
        const newStaff = await Staff.create(req.body);
        res.status(201).json(newStaff);
    } catch (error) {
        res.status(400).json({ message: 'Error creating staff', error });
    }
};

// Update staff
export const updateStaff = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updated] = await Staff.update(req.body, { where: { staff_id: id as string } });
        if (updated) {
            const updatedStaff = await Staff.findByPk(id as string);
            res.json(updatedStaff);
        } else {
            res.status(404).json({ message: 'Staff not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating staff', error });
    }
};

// Delete staff
export const deleteStaff = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await Staff.destroy({ where: { staff_id: id as string } });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Staff not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting staff', error });
    }
};
