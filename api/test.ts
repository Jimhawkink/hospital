import type { VercelRequest, VercelResponse } from '@vercel/node';

export default (req: VercelRequest, res: VercelResponse) => {
    res.status(200).json({
        message: "API is working!",
        timestamp: new Date().toISOString(),
        node: process.version,
        env: {
            DATABASE_URL: process.env.DATABASE_URL ? "SET" : "NOT SET",
            JWT_SECRET: process.env.JWT_SECRET ? "SET" : "NOT SET",
            VERCEL: process.env.VERCEL || "not set"
        }
    });
};
