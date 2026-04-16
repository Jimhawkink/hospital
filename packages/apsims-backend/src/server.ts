import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database';

// Route imports
import authRoutes from './routes/authRoutes';
import statsRoutes from './routes/statsRoutes';
import hrRoutes from './routes/hrRoutes';
import studentRoutes from './routes/studentRoutes';
import examRoutes from './routes/examRoutes';
import feeRoutes from './routes/feeRoutes';
import incomeRoutes from './routes/incomeRoutes';
import timetableRoutes from './routes/timetableRoutes';
import remedialRoutes from './routes/remedialRoutes';
import pocketMoneyRoutes from './routes/pocketMoneyRoutes';
import reportsRoutes from './routes/reportsRoutes';

// Model imports (ensures they register with Sequelize for sync)
import './models/User';
import './models/Staff';
import './models/SubordinateStaff';
import './models/Student';
import './models/ExamType';
import './models/ExamResult';
import './models/GradingSystem';
import './models/FeeStructure';
import './models/FeePayment';
import './models/Income';
import './models/TimetableSlot';
import './models/RemedialClass';
import './models/PocketMoneyAccount';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/remedial', remedialRoutes);
app.use('/api/pocket-money', pocketMoneyRoutes);
app.use('/api/reports', reportsRoutes);

// Test Route
app.get('/', (req: Request, res: Response) => {
    res.send('APSIMS Backend is running!');
});

// Database Connection & Start
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');

        // Sync all models (creates tables if they don't exist)
        await sequelize.sync({ alter: true });
        console.log('All models synchronized successfully.');

        app.listen(port, () => {
            console.log(`[server]: Server is running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

startServer();
