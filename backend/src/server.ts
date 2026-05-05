import app from './app';
import dotenv from 'dotenv';
import pool from './config/database';

dotenv.config();

const PORT = process.env.PORT || 3000;

const start = async () => {
  try {
    await pool.query('SELECT NOW()');
    app.listen(PORT, () => {
      console.log(`MovieCrush server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
};

start();