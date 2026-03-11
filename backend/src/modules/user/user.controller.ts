import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { registerUser, loginUser, getUserById } from './user.service';
import { RegisterInput, LoginInput } from './user.types';
import { AuthRequest } from '../../middleware/auth.middleware';

const generateTokens = (userId: number, uuid: string) => {
  const accessToken = jwt.sign(
    { userId, uuid },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { userId, uuid },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  try {
    const input: RegisterInput = req.body;

    if (!input.email || !input.password || !input.username) {
      res.status(400).json({ error: 'Email, password and username are required' });
      return;
    }

    const user = await registerUser(input);
    const { accessToken, refreshToken } = generateTokens(user.id, user.uuid);
    const { password_hash, ...userWithoutPassword } = user;

    res.status(201).json({ user: userWithoutPassword, accessToken, refreshToken });
  } catch (err: any) {
    if (err.message === 'Email or username already exists') {
      res.status(409).json({ error: err.message });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const input: LoginInput = req.body;

    if (!input.email || !input.password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await loginUser(input);
    const { accessToken, refreshToken } = generateTokens(user.id, user.uuid);
    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({ user: userWithoutPassword, accessToken, refreshToken });
  } catch (err: any) {
    if (err.message === 'Invalid email or password') {
      res.status(401).json({ error: err.message });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET as string
    ) as any;

    const user = await getUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const tokens = generateTokens(user.id, user.uuid);
    res.status(200).json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { password_hash, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};