import sequelize from './config/database';
import User from './models/User';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Sync User model (ensure table exists)
        await User.sync({ force: true }); // WARNING: This drops the table! Safe for initial seed.

        console.log('User table created.');

        const users = [
            {
                username: 'admin@alphaplus.com',
                password: 'password123',
                role: 'admin',
                name: 'System Administrator'
            },
            {
                username: 'bursar@alphaplus.com',
                password: 'password123',
                role: 'bursar',
                name: 'Finance Officer'
            },
            {
                username: 'teacher@alphaplus.com',
                password: 'password123',
                role: 'teacher',
                name: 'Senior Teacher'
            }
        ];

        for (const u of users) {
            await User.create(u);
            console.log(`Created user: ${u.username} (${u.role})`);
        }

        console.log('Seeding complete.');
        process.exit(0);

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
