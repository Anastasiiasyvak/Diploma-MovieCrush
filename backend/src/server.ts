import app from './app';
import dotenv from 'dotenv';
import pool from './config/database';
import logger from './config/logger';

dotenv.config();

const REQUIRED_ENV = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
];

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  logger.error({ missing: missingEnv }, 'Missing required environment variables');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await pool.query('SELECT NOW()');
    app.listen(PORT, () => {
      logger.info({ port: PORT }, 'MovieCrush server running');
    });
  } catch (err) {
    logger.error({ err }, 'Failed to connect to database');
    process.exit(1);
  }
};

start();