// Vercel Serverless: /api/auth/login
// Authenticates against Supabase PostgreSQL hms_users table

import { Sequelize, DataTypes, Model } from 'sequelize';
// @ts-ignore
import * as pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Lazily create Sequelize instance per cold start
let _sequelize: Sequelize | null = null;

const getSequelize = () => {
    if (!_sequelize) {
        console.log('🔌 Initializing Sequelize connection...');
        try {
            _sequelize = new Sequelize({
                dialect: 'postgres',
                dialectModule: pg,
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '6543'),
                database: process.env.DB_NAME || 'postgres',
                username: process.env.DB_USER || 'postgres',
                password: process.env.DB_PASSWORD || '',
                logging: false,
                dialectOptions: {
                    ssl: {
                        require: true,
                        rejectUnauthorized: false,
                    },
                    connectTimeout: 10000,
                },
                pool: {
                    max: 2,
                    min: 0,
                    acquire: 30000,
                    idle: 10000,
                },
            });
        } catch (error) {
            console.error('❌ Sequelize Init Error:', error);
            throw error;
        }
    }
    return _sequelize as Sequelize;
};

// User model matching hms_users table
class User extends Model {
    declare id: number;
    declare name: string;
    declare email: string;
    declare password: string;
    declare role: string;
}

let _modelInitialised = false;

const initUserModel = (sequelize: Sequelize) => {
    if (_modelInitialised) return User;
    User.init(
        {
            id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
            name: { type: DataTypes.STRING, allowNull: false },
            email: { type: DataTypes.STRING, allowNull: false, unique: true },
            password: { type: DataTypes.STRING, allowNull: false },
            role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'user' },
        },
        {
            sequelize,
            tableName: 'hms_users',
            timestamps: true,
            // hms_users columns are camelCase: "createdAt", "updatedAt"
            underscored: false,
        }
    );
    _modelInitialised = true;
    return User;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') return res.status(200).end();

    console.log(`📥 API Request: ${req.method} ${req.url}`);
    console.log('Environment Debug:', {
        DB_HOST: process.env.DB_HOST ? 'Set' : 'Missing',
        DB_USER: process.env.DB_USER || 'Default (postgres)',
        DB_PORT: process.env.DB_PORT,
        DB_NAME: process.env.DB_NAME
    });

    if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

    try {
        const { email, password } = req.body || {};

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        console.log(`🔐 Login attempt for: ${email}`);

        // ── Hardcoded emergency fallback ──
        if (email === 'admin@kwh.com' && password === 'Admin@123') {
            console.log('✅ Hardcoded admin credentials matched');
            const token = jwt.sign(
                { id: 99999, role: 'admin', name: 'System Admin', email },
                JWT_SECRET,
                { expiresIn: '1d' }
            );
            return res.status(200).json({
                token,
                user: { id: 99999, name: 'System Admin', email, role: 'admin' },
            });
        }

        // ── Database authentication ──
        const sequelize = getSequelize();
        initUserModel(sequelize);

        await sequelize.authenticate();
        console.log('✅ DB connected');

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.log(`❌ User not found: ${email}`);
            return res.status(404).json({ message: 'User not found' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            console.log(`❌ Invalid password for: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        console.log(`✅ Login success: ${email} (role: ${user.role})`);

        return res.status(200).json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (error: any) {
        console.error('❌ Login handler error:', error);

        // DEBUG: Return full error details even in production
        return res.status(500).json({
            message: `Login Error: ${error.message}`,
            details: error.stack,
            envCheck: {
                hasDBHost: !!process.env.DB_HOST,
                hasDBUser: !!process.env.DB_USER,
                hasDBPass: !!process.env.DB_PASSWORD
            }
        });
    }
}
