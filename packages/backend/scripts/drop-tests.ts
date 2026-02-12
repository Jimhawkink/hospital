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
    logging: console.log
});

(async () => {
    try {
        console.log("🔥 Dropping investigation tables...");
        await sequelize.query('DROP TABLE IF EXISTS "hms_investigation_results" CASCADE');
        await sequelize.query('DROP TABLE IF EXISTS "hms_investigation_requests" CASCADE');
        await sequelize.query('DROP TABLE IF EXISTS "hms_investigation_tests" CASCADE');
        console.log("✅ Tables dropped.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed:", error);
        process.exit(1);
    }
})();
