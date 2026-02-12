import 'dotenv/config';
import { Sequelize, Model, DataTypes } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'postgres',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  logging: console.log,
  dialectOptions: (process.env.NODE_ENV === 'production' || process.env.DB_HOST !== 'localhost') ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
});

export { sequelize };