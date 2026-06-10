import { Pool } from 'pg';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

const useSSL = process.env.DB_SSL === 'true';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  logger.debug('New PostgreSQL pool connection established');
});

pool.on('error', (err) => {
  logger.error({ err }, 'PostgreSQL pool error');
});

export default pool;