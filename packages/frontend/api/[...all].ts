import type { VercelRequest, VercelResponse } from '@vercel/node';
import serverless from 'serverless-http';
import path from 'path';
import dotenv from 'dotenv';

// Load env from multiple locations
const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '../../.env'),
];
for (const p of envPaths) {
    try { dotenv.config({ path: p }); } catch {}
}

let serverlessHandler: any;
let initError: string | null = null;

export default async (req: VercelRequest, res: VercelResponse) => {
    try {
        if (initError) {
            return res.status(500).json({
                error: "Server initialization previously failed",
                details: initError
            });
        }

        if (!serverlessHandler) {
            console.log("⚡ Initializing Serverless Backend...");
            console.log("⚡ DB_HOST:", process.env.DB_HOST || "NOT SET");
            console.log("⚡ DB_USER:", process.env.DB_USER ? "SET" : "NOT SET");
            console.log("⚡ DB_PASSWORD:", process.env.DB_PASSWORD ? "SET" : "NOT SET");
            try {
                const { initApp } = await import('../src/backend_mirror/server');
                const app = await initApp();
                serverlessHandler = serverless(app);
                console.log("✅ Serverless Backend initialized successfully");
            } catch (initErr: any) {
                initError = initErr?.message || String(initErr);
                console.error("❌ Serverless Init Error:", initError);
                console.error("❌ Stack:", initErr?.stack || '');
                return res.status(500).json({
                    error: "Failed to initialize backend",
                    details: initError,
                    stack: initErr?.stack?.substring(0, 500)
                });
            }
        }

        // Vercel strips /api prefix when routing to functions in api/ directory.
        // Express routes are registered with /api prefix, so we must restore it.
        const originalUrl = req.url || '';
        if (!originalUrl.startsWith('/api')) {
            req.url = `/api${originalUrl}`;
        }
        console.log(`⚡ Incoming Request: ${req.method} ${originalUrl} -> ${req.url}`);
        return serverlessHandler(req, res);
    } catch (error: any) {
        console.error("❌ Serverless Error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            details: error?.message || String(error)
        });
    }
};
