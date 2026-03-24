import pool from '../../config/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { RegisterInput, LoginInput, User } from './user.types';
import { sendVerificationEmail, sendResetPasswordEmail } from '../../config/email.service';
import { ProfileResponse, UpdateProfileInput, UserList } from './user.types';

const DEFAULT_LISTS = [
  { list_type: 'watched', name: 'Watched'   },
  { list_type: 'favorites', name: 'Favorites' },
  { list_type: 'watchlist', name: 'Watchlist' },
];

const createDefaultLists = async (userId: number): Promise<void> => {
  const values = DEFAULT_LISTS.map((_, i) =>
    `($1, $${i * 2 + 2}, $${i * 2 + 3})`
  ).join(', ');
  const params = [userId, ...DEFAULT_LISTS.flatMap(l => [l.list_type, l.name])];
  await pool.query(
    `INSERT INTO user_lists (user_id, list_type, name) VALUES ${values}`,
    params
  );
};
 

export const registerUser = async (input: RegisterInput): Promise<User> => {
  const { email, password, username, first_name, last_name, language } = input;

  const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingEmail.rows.length > 0) throw new Error('Email already exists');

  const existingUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existingUsername.rows.length > 0) throw new Error('Username already exists');

  const password_hash = await bcrypt.hash(password, 12);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const result = await pool.query(
    `INSERT INTO users
      (email, password_hash, username, first_name, last_name, language,
       account_status, verification_token, verification_token_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
     RETURNING *`,
    [email, password_hash, username, first_name || null, last_name || null, language || 'en', verificationToken, tokenExpiresAt]
  );

  const user: User = result.rows[0];
  await createDefaultLists(user.id);

  sendVerificationEmail(email, username, verificationToken)
    .then(() => console.log('Verification email sent to:', email))
    .catch(err => console.error('Failed to send verification email:', err.message));

  return user;
};


export const verifyEmail = async (token: string): Promise<boolean> => {
  const result = await pool.query(
    `SELECT id, verification_token_expires_at FROM users WHERE verification_token = $1`,
    [token]
  );

  if (result.rows.length === 0) return false;

  const user = result.rows[0];
  if (new Date() > new Date(user.verification_token_expires_at)) return false;

  await pool.query(
    `UPDATE users
     SET email_verified = TRUE,
         account_status = 'active',
         verification_token = NULL,
         verification_token_expires_at = NULL
     WHERE id = $1`,
    [user.id]
  );

  return true;
};


export const checkEmailVerified = async (
  email: string
): Promise<{ verified: boolean; userId: number; uuid: string } | null> => {
  const result = await pool.query(
    'SELECT id, uuid, email_verified FROM users WHERE email = $1',
    [email]
  );
  if (result.rows.length === 0) return null;
  const user = result.rows[0];
  return { verified: user.email_verified, userId: user.id, uuid: user.uuid };
};


export const requestPasswordReset = async (email: string): Promise<void> => {
  const result = await pool.query(
    'SELECT id, username FROM users WHERE email = $1 AND account_status = $2',
    [email, 'active']
  );

  if (result.rows.length === 0) return;

  const user = result.rows[0];
  const resetToken = crypto.randomBytes(32).toString('hex');
  const tokenExpiresAt = new Date(Date.now() + 60 * 60 * 1000); 

  await pool.query(
    `UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3`,
    [resetToken, tokenExpiresAt, user.id]
  );

  sendResetPasswordEmail(email, user.username, resetToken)
    .then(() => console.log('Reset password email sent to:', email))
    .catch(err => console.error('Failed to send reset email:', err.message));
};


export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
  const result = await pool.query(
    `SELECT id, reset_token_expires_at FROM users WHERE reset_token = $1`,
    [token]
  );

  if (result.rows.length === 0) return false;

  const user = result.rows[0];
  if (new Date() > new Date(user.reset_token_expires_at)) return false;

  const password_hash = await bcrypt.hash(newPassword, 12);

  await pool.query(
    `UPDATE users
     SET password_hash = $1,
         reset_token = NULL,
         reset_token_expires_at = NULL
     WHERE id = $2`,
    [password_hash, user.id]
  );

  return true;
};


export const loginUser = async (input: LoginInput): Promise<User> => {
  const { email, password } = input;

  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

  const dummyHash = '$2a$12$dummyhashfordummycomparison000000000000000000000000000';
  const storedHash = result.rows[0]?.password_hash || dummyHash;
  const isValidPassword = await bcrypt.compare(password, storedHash);

  if (result.rows.length === 0 || !isValidPassword) throw new Error('Invalid email or password');

  const user = result.rows[0];
  if (user.account_status === 'banned')  throw new Error('Account is banned');
  if (user.account_status === 'pending') throw new Error('Email not verified');

  await pool.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [user.id]);

  return user;
};
 

export const getUserById = async (id: number): Promise<User | null> => {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND account_status = $2',
    [id, 'active']
  );
  return result.rows[0] || null;
};

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
 
export const getUserFriends = async (userId: number): Promise<any[]> => {
  // TODO: заімплементую коли створю таблиці друзів 
  return [];
};