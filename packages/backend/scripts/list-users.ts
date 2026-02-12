import { Sequelize } from 'sequelize';
import 'dotenv/config';

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log("Connected to DB.");

        const [results] = await sequelize.query(`SELECT id, name, email, role, password FROM hms_users`);
        console.log("\nUsers found:");
        console.table(results.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            passwordHash: u.password ? u.password.substring(0, 10) + '...' : 'NULL'
        })));

        // Check if password hash matches '1234' (common default)
        // bcrypt hash for '1234' with salt 10 depends on salt.
        // unlikely to match string equality.

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
