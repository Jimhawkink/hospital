import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

// Attempt to load .env from multiple possible locations on Vercel
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
];

for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath });
  } catch {}
}

// Supabase fallback credentials for production
const DB_HOST = process.env.DB_HOST || 'aws-1-eu-west-1.pooler.supabase.com';
const DB_PORT = parseInt(process.env.DB_PORT || '5432');
const DB_NAME = process.env.DB_NAME || 'postgres';
const DB_USER = process.env.DB_USER || 'postgres.enlqpifpxuecxxozyiak';
const DB_PASSWORD = process.env.DB_PASSWORD || '@JIm47jhC_7%#';

console.log(`🔌 DB Config: host=${DB_HOST}, port=${DB_PORT}, db=${DB_NAME}, user=${DB_USER?.substring(0,10)}...`);

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 3,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export { sequelize };