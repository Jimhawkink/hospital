import { Request, Response } from 'express';
import ExamType from '../models/ExamType';
import ExamResult from '../models/ExamResult';
import GradingSystem from '../models/GradingSystem';

// --- Exam Types ---
export const getExamTypes = async (req: Request, res: Response) => {
    try {
        const types = await ExamType.findAll();
        res.json(types);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam types', error });
    }
};

export const createExamType = async (req: Request, res: Response) => {
    try {
        const type = await ExamType.create(req.body);
        res.status(201).json(type);
    } catch (error) {
        res.status(400).json({ message: 'Error creating exam type', error });
    }
};

// --- Grading System ---
export const getGradingSystem = async (req: Request, res: Response) => {
    try {
        const grades = await GradingSystem.findAll({ order: [['min_score', 'DESC']] });
        res.json(grades);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching grading system', error });
    }
};

export const createGrading = async (req: Request, res: Response) => {
    try {
        const grade = await GradingSystem.create(req.body);
        res.status(201).json(grade);
    } catch (error) {
        res.status(400).json({ message: 'Error creating grading', error });
    }
};

// --- Results / Marks Entry ---
export const enterMarks = async (req: Request, res: Response) => {
    try {
        const { marks, exam_type_id, term, year } = req.body;
        // Expecting marks to be an array of { student_id, subject_id, score }

        if (!Array.isArray(marks)) {
            return res.status(400).json({ message: 'Marks must be an array' });
        }

        const gradingSystem = await GradingSystem.findAll({ order: [['min_score', 'DESC']] });

        const results = [];

        for (const mark of marks) {
            const { student_id, subject_id, score } = mark;

            // Calculate grade
            let grade = 'E';
            let points = 1;
            for (const g of gradingSystem) {
                if (score >= g.min_score) {
                    grade = g.grade;
                    points = g.points;
                    break;
                }
            }

            // Upsert result
            const [result] = await ExamResult.upsert({
                student_id,
                exam_type_id,
                subject_id,
                score,
                grade,
                points,
                term,
                year
            });
            results.push(result);
        }

        res.json({ message: 'Marks entered successfully', count: results.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error entering marks', error });
    }
};

export const getStudentResults = async (req: Request, res: Response) => {
    try {
        const { studentId, term, year } = req.params;
        const results = await ExamResult.findAll({
            where: { student_id: studentId, term, year },
            include: [ExamType] // Assuming association is set up, if not need to define it
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results', error });
    }
};

interface StudentTermStats {
    student_id: number;
    total_score: number;
    average_score: number;
    mean_grade: string;
    class_position?: number;
    stream_position?: number;
}

export const getTermAnalysis = async (req: Request, res: Response) => {
    try {
        const { term, year } = req.query;
        // Fetch all results for this term/year
        const results = await ExamResult.findAll({
            where: { term: term as string, year: Number(year) }
        });

        // Group by student
        const studentStats: Record<number, { total: number; count: number }> = {};

        results.forEach(r => {
            if (!studentStats[r.student_id]) {
                studentStats[r.student_id] = { total: 0, count: 0 };
            }
            studentStats[r.student_id].total += r.score;
            studentStats[r.student_id].count += 1;
        });

        // Calculate Average
        const leaderboard: StudentTermStats[] = Object.keys(studentStats).map(studentId => {
            const id = Number(studentId);
            const { total, count } = studentStats[id];
            const avg = total / count;
            return {
                student_id: id,
                total_score: total,
                average_score: Math.round(avg * 100) / 100, // 2 decimal places
                // Placeholder grade logic for average
                mean_grade: avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'E'
            };
        });

        // Sort by Average Score DESC
        leaderboard.sort((a, b) => b.average_score - a.average_score);

        // Assign positions
        leaderboard.forEach((student, index) => {
            student.class_position = index + 1;
        });

        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ message: 'Error generating analysis', error });
    }
};
