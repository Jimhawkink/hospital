import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log("🔍 Checking connection parameters...");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("SSL Config:", process.env.NODE_ENV === 'production' || process.env.DB_HOST !== 'localhost' ? 'Enabled' : 'Disabled');

const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: console.log
});

(async () => {
    try {
        console.log("⏳ Connecting...");
        await sequelize.authenticate();
        console.log("✅ Connection SUCCESS!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Connection FAILED:", error);
        process.exit(1);
    }
})();
