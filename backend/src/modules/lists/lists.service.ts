import pool from '../../config/database';
import { UserList } from '../shared/user.types';

const DEFAULT_LISTS = [
  { list_type: 'watched', name: 'Watched'   },
  { list_type: 'favorites', name: 'Favorites' },
  { list_type: 'watchlist', name: 'Watchlist' },
];

export const createDefaultLists = async (userId: number): Promise<void> => {
  for (const list of DEFAULT_LISTS) {
    await pool.query(
      `INSERT INTO user_lists (user_id, list_type, name) VALUES ($1, $2, $3)`,
      [userId, list.list_type, list.name]
    );
  }
};

export const createCustomList = async (
  userId: number,
  name: string,
  isPrivate: boolean = false
): Promise<UserList> => {
  const result = await pool.query(
    `INSERT INTO user_lists (user_id, list_type, name, is_private)
     VALUES ($1, 'custom', $2, $3) RETURNING *`,
    [userId, name.trim(), isPrivate]
  );
  await pool.query(
    `UPDATE users SET custom_lists_count = custom_lists_count + 1 WHERE id = $1`,
    [userId]
  );
  return result.rows[0];
};
 
export const deleteCustomList = async (userId: number, listId: number): Promise<boolean> => {
  const check = await pool.query(
    `SELECT id FROM user_lists WHERE id = $1 AND user_id = $2 AND list_type = 'custom'`,
    [listId, userId]
  );
  if (check.rows.length === 0) return false;
 
  await pool.query(`DELETE FROM user_lists WHERE id = $1`, [listId]);
  await pool.query(
    `UPDATE users SET custom_lists_count = GREATEST(0, custom_lists_count - 1) WHERE id = $1`,
    [userId]
  );
  return true;
};
 
export const toggleListPrivacy = async (
  userId: number,
  listId: number,
  isPrivate: boolean
): Promise<UserList | null> => {
  const result = await pool.query(
    `UPDATE user_lists SET is_private = $1
     WHERE id = $2 AND user_id = $3 AND list_type = 'custom'
     RETURNING *`,
    [isPrivate, listId, userId]
  );
  return result.rows[0] || null;
};