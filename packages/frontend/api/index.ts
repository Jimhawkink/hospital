// Vercel Serverless: /api catch-all handler
// Handles /api/health and any unmatched /api/* routes

import { Sequelize } from 'sequelize';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let _sequelize: Sequelize | null = null;

const getSequelize = () => {
    if (!_sequelize) {
        _sequelize = new Sequelize({
            dialect: 'postgres',
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
            },
            pool: {
                max: 2,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
        });
    }
    return _sequelize;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,PATCH,DELETE');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') return res.status(200).end();

    const path = req.url || '';
    console.log(`📥 ${req.method} ${path}`);

    try {
        // Health check
        if (path.includes('/health') || path === '/api' || path === '/api/') {
            try {
                const sequelize = getSequelize();
                await sequelize.authenticate();
                return res.status(200).json({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    database: 'connected',
                });
            } catch (dbError: any) {
                return res.status(500).json({
                    status: 'error',
                    message: 'Database connection failed',
                    error: dbError.message,
                });
            }
        }

        // Catch-all: endpoint not found
        return res.status(404).json({
            message: 'Endpoint not found',
            path,
            method: req.method,
            hint: 'Available endpoints: GET /api/health, POST /api/auth/login',
        });
    } catch (error: any) {
        console.error('❌ API handler error:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error',
        });
    }
}
