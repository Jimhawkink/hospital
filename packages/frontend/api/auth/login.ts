import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey';

// Minimal handler without heavy dependencies to debug crash
export default async function handler(req: any, res: any) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('Login attempt received');
        const body = req.body || {};
        const { email, password } = body;

        console.log(`Email provided: ${email}`);

        // HARDCODED CHECK (Debugging Mode)
        if (email === 'admin@kwh.com' && password === 'Admin@123') {
            console.log('✅ Hardcoded credentials matched');
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

        return res.status(401).json({
            message: 'Invalid credentials. (Note: Database connection is temporarily disabled for debugging)'
        });

    } catch (error: any) {
        console.error('Handler crash:', error);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
}
