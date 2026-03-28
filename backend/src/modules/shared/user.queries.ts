import pool from '../../config/database';
import { User } from './user.types';

export const getUserById = async (id: number): Promise<User | null> => {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND account_status = $2',
    [id, 'active']
  );
  return result.rows[0] || null;
};