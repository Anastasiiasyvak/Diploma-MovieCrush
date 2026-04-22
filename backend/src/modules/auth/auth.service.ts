import pool from '../../config/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail, sendResetPasswordEmail } from '../../config/email.service';
import { RegisterInput, LoginInput } from './auth.types';
import { User } from '../shared/user.types';
import { createDefaultLists } from '../lists/lists.service';

const isEmailVerificationEnabled = (): boolean =>
  process.env.EMAIL_VERIFICATION_ENABLED === 'true';

export const registerUser = async (input: RegisterInput): Promise<User> => {
  const { email, password, username, first_name, last_name, language } = input;

  const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingEmail.rows.length > 0) throw new Error('Email already exists');

  const existingUsername = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
  if (existingUsername.rows.length > 0) throw new Error('Username already exists');

  const password_hash = await bcrypt.hash(password, 12);

  const verificationEnabled = isEmailVerificationEnabled();
  const verificationToken = verificationEnabled ? crypto.randomBytes(32).toString('hex') : null;
  const tokenExpiresAt    = verificationEnabled ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null;
  const accountStatus     = verificationEnabled ? 'pending' : 'active';
  const emailVerified     = !verificationEnabled;

  const result = await pool.query(
    `INSERT INTO users
      (email, password_hash, username, first_name, last_name, language,
       account_status, email_verified, verification_token, verification_token_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      email, password_hash, username, first_name || null, last_name || null, language || 'en',
      accountStatus, emailVerified, verificationToken, tokenExpiresAt,
    ]
  );

  const user: User = result.rows[0];
  await createDefaultLists(user.id);

  if (verificationEnabled && verificationToken) {
    sendVerificationEmail(email, username, verificationToken)
      .then(() => console.log('Verification email sent to:', email))
      .catch(err => console.error('Failed to send verification email:', err.message));
  } else {
    console.log(`[dev] Email verification disabled — user ${email} auto-activated`);
  }

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
  if (user.account_status === 'banned') throw new Error('Account is banned');

  if (isEmailVerificationEnabled() && user.account_status === 'pending') {
    throw new Error('Email not verified');
  }

  await pool.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [user.id]);

  return user;
};