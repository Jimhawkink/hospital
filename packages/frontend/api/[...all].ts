import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import { initApp } from '../src/backend_mirror/server';

let serverlessHandler: any;

export default async (req: VercelRequest, res: VercelResponse) => {
    try {
        if (!serverlessHandler) {
            console.log("⚡ Initializing Serverless Backend...");
            const app = await initApp();
            serverlessHandler = serverless(app);
        }

        // Forward request to Express
        console.log(`⚡ Incoming Request: ${req.method} ${req.url}`);
        return serverlessHandler(req, res);
    } catch (error) {
        console.error("❌ Serverless Error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
