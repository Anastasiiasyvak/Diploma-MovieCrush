import pool from '../../config/database';
import bcrypt from 'bcryptjs';
import { User } from '../shared/user.types';

export const updateUsername = async (
  userId: number,
  username: string
): Promise<Omit<User, 'password_hash'> | null> => {
  const existing = await pool.query(
    'SELECT id FROM users WHERE username = $1 AND id != $2',
    [username, userId]
  );
  if (existing.rows.length > 0) throw new Error('Username already taken');

  const result = await pool.query(
    `UPDATE users SET username = $1, updated_at = NOW()
     WHERE id = $2 RETURNING
       id, uuid, email, username, first_name, last_name, profile_image_url,
       language, instagram_username, telegram_username, soulmate_consent,
       subscription_type, account_status, friends_count, followers_count,
       following_count, movies_watched, series_watched, episodes_watched,
       custom_lists_count, created_at`,
    [username.trim(), userId]
  );
  return result.rows[0] || null;
};

export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<boolean> => {
  const result = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );
  if (result.rows.length === 0) return false;

  const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!isValid) throw new Error('Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, 12);
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newHash, userId]
  );
  return true;
};

export const updateSoulmateConsent = async (
  userId: number,
  consent: boolean
): Promise<void> => {
  await pool.query(
    'UPDATE users SET soulmate_consent = $1, updated_at = NOW() WHERE id = $2',
    [consent, userId]
  );
};

export const updateLanguage = async (
  userId: number,
  language: string
): Promise<void> => {
  await pool.query(
    'UPDATE users SET language = $1, updated_at = NOW() WHERE id = $2',
    [language, userId]
  );
};

export const softDeleteUser = async (userId: number): Promise<void> => {
  await pool.query(
    `UPDATE users
     SET account_status = 'deleted', updated_at = NOW()
     WHERE id = $1`,
    [userId]
  );
};