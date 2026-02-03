// Vercel Serverless API Handler
// This is a standalone serverless function that connects to Supabase PostgreSQL

import { Sequelize, DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Initialize Sequelize with Supabase PostgreSQL connection
// Parse Supabase URL to get connection details
const getDbConfig = () => {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    // For Supabase, we use the direct PostgreSQL connection
    // Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
    return {
        dialect: 'postgres' as const,
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
    };
};

const sequelize = new Sequelize(getDbConfig());

// User model
class User extends Model {
    declare id: number;
    declare name: string;
    declare email: string;
    declare password: string;
    declare role: string;
}

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

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Main handler
export default async function handler(req: any, res: any) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname;

    console.log(`📥 ${req.method} ${path}`);

    try {
        // Health check
        if (path === '/api/health' || path === '/api/') {
            try {
                await sequelize.authenticate();
                return res.status(200).json({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    database: 'connected',
                    path: path
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
        if (path === '/api/auth/login' && req.method === 'POST') {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ message: 'Email and password required' });
            }

            try {
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
            }
        }

        // Not found
        return res.status(404).json({
            message: 'Endpoint not found',
            path: path,
            method: req.method,
            availableEndpoints: ['/api/health', '/api/auth/login']
        });

    } catch (error: any) {
        console.error('Handler error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}
