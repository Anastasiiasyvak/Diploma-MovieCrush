import pool from '../../config/database';
import bcrypt from 'bcryptjs';
import { RegisterInput, LoginInput, User } from './user.types';

export const registerUser = async (input: RegisterInput): Promise<User> => {
  const { email, password, username, first_name, last_name, language } = input;

  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('Email or username already exists');
  }

  const password_hash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `INSERT INTO users (email, password_hash, username, first_name, last_name, language)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [email, password_hash, username, first_name || null, last_name || null, language || 'en']
  );

  return result.rows[0];
};

export const loginUser = async (input: LoginInput): Promise<User> => {
  const { email, password } = input;

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 AND account_status = $2',
    [email, 'active']
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new Error('Invalid email or password');
  }

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