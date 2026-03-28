import pool from '../../config/database';
import { ProfileResponse, UpdateProfileInput } from './profile.types';
import { User } from '../shared/user.types';

export const getUserProfile = async (userId: number): Promise<ProfileResponse | null> => {
  const userResult = await pool.query(
    `SELECT id, uuid, email, username, first_name, last_name, profile_image_url,
            language, instagram_username, telegram_username, soulmate_consent,
            subscription_type, account_status, friends_count, followers_count,
            following_count, movies_watched, series_watched, episodes_watched,
            custom_lists_count, created_at
     FROM users WHERE id = $1 AND account_status = $2`,
    [userId, 'active']
  );
  if (userResult.rows.length === 0) return null;
 
  const listsResult = await pool.query(
    `SELECT id, user_id, list_type, name, is_private, created_at
     FROM user_lists WHERE user_id = $1 ORDER BY created_at ASC`,
    [userId]
  );
 
  return { user: userResult.rows[0], lists: listsResult.rows };
};
 
export const updateUserProfile = async (
  userId: number,
  input: UpdateProfileInput
): Promise<Omit<User, 'password_hash'> | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let idx = 1;
 
  if (input.first_name !== undefined) { fields.push(`first_name = $${idx++}`); values.push(input.first_name || null); }
  if (input.last_name !== undefined) { fields.push(`last_name = $${idx++}`); values.push(input.last_name || null); }
  if (input.instagram_username !== undefined) { fields.push(`instagram_username = $${idx++}`); values.push(input.instagram_username || null); }
  if (input.telegram_username !== undefined) { fields.push(`telegram_username = $${idx++}`); values.push(input.telegram_username || null); }
  if (input.profile_image_url !== undefined) { fields.push(`profile_image_url = $${idx++}`); values.push(input.profile_image_url || null); }
 
  if (fields.length === 0) return null;
  fields.push(`updated_at = NOW()`);
  values.push(userId);
 
  const result = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING
      id, uuid, email, username, first_name, last_name, profile_image_url,
      language, instagram_username, telegram_username, soulmate_consent,
      subscription_type, account_status, friends_count, followers_count,
      following_count, movies_watched, series_watched, episodes_watched,
      custom_lists_count, created_at`,
    values
  );
  return result.rows[0] || null;
};