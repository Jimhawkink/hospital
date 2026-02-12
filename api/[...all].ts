import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import { initApp } from '../packages/backend/src/server';

let serverlessHandler: any;

export default async (req: VercelRequest, res: VercelResponse) => {
    try {
        if (!serverlessHandler) {
            console.log("⚡ Initializing Serverless Backend...");
            const app = await initApp();
            serverlessHandler = serverless(app);
        }

        // Vercel strips /api prefix when routing to functions in api/ directory.
        // Express routes are registered with /api prefix, so we must restore it.
        const originalUrl = req.url || '';
        if (!originalUrl.startsWith('/api')) {
            req.url = `/api${originalUrl}`;
        }
        console.log(`⚡ Incoming Request: ${req.method} ${originalUrl} -> ${req.url}`);
        return serverlessHandler(req, res);
    } catch (error) {
        console.error("❌ Serverless Error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
