import app from './app';
import dotenv from 'dotenv';
import pool from './config/database';

dotenv.config();

const PORT = process.env.PORT || 3000;

pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`MovieCrush server running on port ${PORT}`);
  });
});