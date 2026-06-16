import pool from '../../config/database';
import { User } from './user.types';

export const PROFILE_COLUMNS = `
  id, uuid, email, username, first_name, last_name, profile_image_url,
  language, instagram_username, telegram_username, soulmate_consent,
  subscription_type, account_status, friends_count, followers_count,
  following_count, movies_watched, series_watched, episodes_watched,
  custom_lists_count, created_at`;

export const getUserById = async (id: number): Promise<User | null> => {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND account_status = $2',
    [id, 'active']
  );
  return result.rows[0] || null;
};

export const getWatchedCount = async (userId: number): Promise<number> => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM user_movie_actions WHERE user_id = $1 AND is_watched = TRUE`,
    [userId]
  );
  return Number(result.rows[0].count);
};