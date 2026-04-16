import { Request, Response } from 'express';
import SubordinateStaff from '../models/SubordinateStaff';

// Get all subordinate staff
export const getAllSubordinateStaff = async (req: Request, res: Response) => {
    try {
        const staff = await SubordinateStaff.findAll();
        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving subordinate staff', error });
    }
};

// Create new subordinate staff
export const createSubordinateStaff = async (req: Request, res: Response) => {
    try {
        const newStaff = await SubordinateStaff.create(req.body);
        res.status(201).json(newStaff);
    } catch (error) {
        res.status(400).json({ message: 'Error creating subordinate staff', error });
    }
};

// Update subordinate staff
export const updateSubordinateStaff = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updated] = await SubordinateStaff.update(req.body, { where: { staff_id: id as string } });
        if (updated) {
            const updatedStaff = await SubordinateStaff.findByPk(id as string);
            res.json(updatedStaff);
        } else {
            res.status(404).json({ message: 'Staff member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating staff member', error });
    }
};

// Delete subordinate staff
export const deleteSubordinateStaff = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await SubordinateStaff.destroy({ where: { staff_id: id as string } });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Staff member not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting staff member', error });
    }
};
