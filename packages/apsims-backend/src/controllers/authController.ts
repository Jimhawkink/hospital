import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    try {
        // Find user by username/email
        const user = await User.findOne({ where: { username: email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValid = await user.validatePassword(password);
        if (!isValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.username, role: user.role, name: user.name },
            process.env.JWT_SECRET as string,
            { expiresIn: '24h' }
        );

        return res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.username,
                role: user.role,
                name: user.name
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

