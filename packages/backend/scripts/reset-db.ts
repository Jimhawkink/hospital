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
        console.log("🔥 Dropping ALL hms_ tables...");
        await sequelize.query(`
            DO $$ DECLARE
                r RECORD;
            BEGIN
                FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'hms_%') LOOP
                    EXECUTE 'DROP TABLE IF EXISTS "' || r.tablename || '" CASCADE';
                END LOOP;
            END $$;
        `);
        console.log("✅ All hms_ tables dropped.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Failed:", error);
        process.exit(1);
    }
})();
