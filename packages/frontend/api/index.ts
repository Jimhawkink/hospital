// Vercel Serverless API Handler for Authentication
// Connects to Supabase PostgreSQL database

import { Sequelize, DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Database configuration for Supabase PostgreSQL
const getSequelize = () => {
    return new Sequelize({
        dialect: 'postgres',
        host: process.env.DB_HOST || 'aws-0-eu-central-1.pooler.supabase.com',
        port: parseInt(process.env.DB_PORT || '6543'),
        database: process.env.DB_NAME || 'postgres',
        username: process.env.DB_USER || 'postgres.enlqpifpxuecxxozyiak',
        password: process.env.DB_PASSWORD || '',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        pool: {
            max: 2,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
};

// User model definition
class User extends Model {
    declare id: number;
    declare name: string;
    declare email: string;
    declare password: string;
    declare role: string;
}

// Initialize User model
const initUserModel = (sequelize: Sequelize) => {
    User.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'user'
        }
    }, {
        sequelize,
        tableName: 'hms_users',
        timestamps: true,
        underscored: true
    });

    return User;
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Main handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Parse the path
    const path = req.url || '';
    console.log(`📥 ${req.method} ${path}`);

    try {
        const sequelize = getSequelize();
        initUserModel(sequelize);

        // Health check
        if (path.includes('/health') || path === '/api' || path === '/api/') {
            try {
                await sequelize.authenticate();
                return res.status(200).json({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    database: 'connected'
                });
            } catch (dbError: any) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Database connection failed',
                    error: dbError.message
                });
            }
        }

        // Login endpoint
        if (path.includes('/auth/login') && req.method === 'POST') {
            const { email, password } = req.body || {};

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password required' });
            }

            try {
                // HARDCODED FALLBACK CREDENTIALS (Requested by User)
                if (email === 'admin@kwh.com' && password === 'Admin@123') {
                    console.log('✅ Using hardcoded admin credentials');
                    const token = jwt.sign(
                        { id: 99999, role: 'Administrator', name: 'System Admin', email: 'admin@kwh.com' },
                        JWT_SECRET,
                        { expiresIn: '1d' }
                    );
                    return res.status(200).json({
                        token,
                        user: { id: 99999, name: 'System Admin', email: 'admin@kwh.com', role: 'Administrator' }
                    });
                }

                await sequelize.authenticate();

                const user = await User.findOne({ where: { email } });

                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }

                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    return res.status(401).json({ message: 'Invalid credentials' });
                }

                const token = jwt.sign(
                    { id: user.id, role: user.role, name: user.name, email: user.email },
                    JWT_SECRET,
                    { expiresIn: '1d' }
                );

                return res.status(200).json({
                    token,
                    user: { id: user.id, name: user.name, email: user.email, role: user.role }
                });
            } catch (dbError: any) {
                console.error('Database error:', dbError);
                return res.status(500).json({
                    message: 'Database error',
                    error: dbError.message
                });
            } finally {
                await sequelize.close();
            }
        }

        // Not found
        return res.status(404).json({
            message: 'Endpoint not found',
            path: path,
            method: req.method,
            hint: 'Available endpoints: /api/health, /api/auth/login'
        });

    } catch (error: any) {
        console.error('Handler error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}
