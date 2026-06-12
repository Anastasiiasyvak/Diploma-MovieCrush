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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO user_lists (user_id, list_type, name, is_private)
       VALUES ($1, 'custom', $2, $3) RETURNING *`,
      [userId, name.trim(), isPrivate]
    );
    await client.query(
      `UPDATE users SET custom_lists_count = custom_lists_count + 1 WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

export const deleteCustomList = async (userId: number, listId: number): Promise<boolean> => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const check = await client.query(
      `SELECT id FROM user_lists WHERE id = $1 AND user_id = $2 AND list_type = 'custom'`,
      [listId, userId]
    );
    if (check.rows.length === 0) {
      await client.query('ROLLBACK');
      return false;
    }

    await client.query(`DELETE FROM user_lists WHERE id = $1`, [listId]);
    await client.query(
      `UPDATE users SET custom_lists_count = GREATEST(0, custom_lists_count - 1) WHERE id = $1`,
      [userId]
    );

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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