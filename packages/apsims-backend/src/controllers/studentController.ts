import { Request, Response } from 'express';
import Student from '../models/Student';

// Get all students
export const getAllStudents = async (req: Request, res: Response) => {
    try {
        const students = await Student.findAll();
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving students', error });
    }
};

// Create new student
export const createStudent = async (req: Request, res: Response) => {
    try {
        const newStudent = await Student.create(req.body);
        res.status(201).json(newStudent);
    } catch (error) {
        res.status(400).json({ message: 'Error creating student', error });
    }
};

// Get student by ID
export const getStudentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const student = await Student.findByPk(id as string);
        if (student) {
            res.json(student);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving student', error });
    }
};

// Update student
export const updateStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const [updated] = await Student.update(req.body, { where: { id: id as string } });
        if (updated) {
            const updatedStudent = await Student.findByPk(id as string);
            res.json(updatedStudent);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating student', error });
    }
};

// Delete student
export const deleteStudent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await Student.destroy({ where: { id: id as string } });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error deleting student', error });
    }
};
