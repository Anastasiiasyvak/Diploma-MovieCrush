import app from './app';
import dotenv from 'dotenv';
import pool from './config/database';
import logger from './config/logger';

dotenv.config();

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