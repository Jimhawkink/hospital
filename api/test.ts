import type { VercelRequest, VercelResponse } from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) => {
    try {
        res.status(200).json({
            message: "API is working!",
            timestamp: new Date().toISOString(),
            node: process.version,
            method: req.method,
            url: req.url,
            env: {
                DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
                DB_HOST: process.env.DB_HOST ? "SET" : "NOT SET",
                DB_NAME: process.env.DB_NAME ? "SET" : "NOT SET",
                DB_USER: process.env.DB_USER ? "SET" : "NOT SET",
                DB_PASSWORD: process.env.DB_PASSWORD ? "SET" : "NOT SET",
                JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET",
                VERCEL: process.env.VERCEL || "not set",
                NODE_ENV: process.env.NODE_ENV || "not set"
            }
        });
    } catch (error) {
        res.status(500).json({
            error: "Test endpoint error",
            message: error instanceof Error ? error.message : String(error)
        });
    }
};
