import { Sequelize } from 'sequelize';

// Supabase connection - use env vars with hardcoded fallback for production
const DB_HOST = process.env.DB_HOST || 'aws-1-eu-west-1.pooler.supabase.com';
const DB_PORT = parseInt(process.env.DB_PORT || '5432');
const DB_NAME = process.env.DB_NAME || 'postgres';
const DB_USER = process.env.DB_USER || 'postgres.enlqpifpxuecxxozyiak';
const DB_PASSWORD = process.env.DB_PASSWORD || '@JIm47jhC_7%#';

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