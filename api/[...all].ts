import type { VercelRequest, VercelResponse } from '@vercel/node';

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
            try {
                const serverless = (await import('serverless-http')).default;
                const { initApp } = await import('../packages/backend/dist/server');
                const app = await initApp();
                serverlessHandler = serverless(app);
                console.log("✅ Serverless Backend initialized successfully");
            } catch (initErr) {
                const errMsg = initErr instanceof Error ? initErr.message : String(initErr);
                const errStack = initErr instanceof Error ? initErr.stack : '';
                initError = errMsg;
                console.error("❌ Serverless Init Error:", errMsg);
                console.error("❌ Stack:", errStack);
                return res.status(500).json({
                    error: "Failed to initialize backend",
                    details: errMsg,
                    stack: process.env.NODE_ENV !== 'production' ? errStack : undefined
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
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("❌ Serverless Error:", errMsg);
        console.error("❌ Stack:", error instanceof Error ? error.stack : '');
        res.status(500).json({
            error: "Internal Server Error",
            details: errMsg
        });
    }
};
