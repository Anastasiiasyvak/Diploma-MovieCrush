import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  registerUser,
  loginUser,
  verifyEmail,
  checkEmailVerified,
  requestPasswordReset,
  resetPassword,
  isEmailVerificationEnabled,
} from './auth.service';
import { getUserById } from '../shared/user.queries';
import { RegisterInput, LoginInput, AuthResponse } from './auth.types';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  verifySuccessPage,
  verifyErrorPage,
  resetSuccessPage,
  resetPasswordForm,
} from './auth.templates';
import {
  validatePassword,
  validateEmail,
  validateUsername,
} from './auth.validators';
import logger from '../../config/logger';


const generateTokens = (userId: number, uuid: string) => {
  const accessToken = jwt.sign(
    { userId, uuid, type: 'access' },
    process.env.JWT_SECRET as string,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, uuid, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: '30d' }
  );
  return { accessToken, refreshToken };
};


export const register = async (req: Request, res: Response) => {
  try {
    const input: RegisterInput = req.body;

    const emailError = validateEmail(input.email);
    if (emailError) { res.status(400).json({ error: emailError, field: 'email' }); return; }

    const usernameError = validateUsername(input.username);
    if (usernameError) { res.status(400).json({ error: usernameError, field: 'username' }); return; }

    const passwordError = validatePassword(input.password);
    if (passwordError) { res.status(400).json({ error: passwordError, field: 'password' }); return; }

    input.email = input.email.trim().toLowerCase();
    input.username = input.username.trim();
    if (input.first_name) input.first_name = input.first_name.trim();
    if (input.last_name) input.last_name = input.last_name.trim();

    const user = await registerUser(input);

    if (isEmailVerificationEnabled()) {
      res.status(201).json({
        message: 'Registration successful! Please check your email to verify your account.',
      });
    } else {
      const { accessToken, refreshToken } = generateTokens(user.id, user.uuid);
      res.status(201).json({
        message: 'Registration successful!',
        accessToken,
        refreshToken,
      });
    }
  } catch (err: any) {
    if (err.message === 'Email already exists') {
      res.status(409).json({ error: 'This email is already registered', field: 'email' }); return;
    }
    if (err.message === 'Username already exists') {
      res.status(409).json({ error: 'This username is already taken', field: 'username' }); return;
    }
    logger.error({ err }, 'register failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyEmailHandler = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    if (!token) { res.status(400).send(verifyErrorPage); return; }

    const success = await verifyEmail(token);
    if (!success) { res.status(400).send(verifyErrorPage); return; }

    res.status(200).send(verifySuccessPage);
  } catch (err) {
    logger.error({ err }, 'verifyEmail failed');
    res.status(500).send(verifyErrorPage);
  }
};

export const checkVerified = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ error: 'Email is required' }); return; }

    const result = await checkEmailVerified(email.trim().toLowerCase());
    res.status(200).json({ verified: result?.verified === true });
  } catch (err) {
    logger.error({ err }, 'checkVerified failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const emailError = validateEmail(email);
    if (emailError) { res.status(400).json({ error: emailError, field: 'email' }); return; }

    await requestPasswordReset(email.trim().toLowerCase());

    res.status(200).json({
      message: 'If this email exists, you will receive a password reset link shortly.',
    });
  } catch (err) {
    logger.error({ err }, 'forgotPassword failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPasswordPage = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    if (!token) { res.status(400).send(verifyErrorPage); return; }
    res.status(200).send(resetPasswordForm(token));
  } catch (err) {
    logger.error({ err }, 'resetPasswordPage failed');
    res.status(500).send(verifyErrorPage);
  }
};

export const resetPasswordHandler = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      res.status(400).send(resetPasswordForm(token, 'Please fill in all fields.')); return;
    }

    if (password !== confirmPassword) {
      res.status(400).send(resetPasswordForm(token, 'Passwords do not match.')); return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      res.status(400).send(resetPasswordForm(token, passwordError)); return;
    }

    const success = await resetPassword(token, password);
    if (!success) {
      res.status(400).send(verifyErrorPage); return;
    }

    res.status(200).send(resetSuccessPage);
  } catch (err) {
    logger.error({ err }, 'resetPassword failed');
    res.status(500).send(resetPasswordForm(req.params.token as string, 'Something went wrong. Please try again.'));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const input: LoginInput = req.body;

    if (!input.email?.trim()) {
      res.status(400).json({ error: 'Email is required', field: 'email' }); return;
    }
    if (!input.password?.trim()) {
      res.status(400).json({ error: 'Password is required', field: 'password' }); return;
    }

    input.email = input.email.trim().toLowerCase();

    const user = await loginUser(input);
    const { accessToken, refreshToken } = generateTokens(user.id, user.uuid);
    const { password_hash, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
    res.status(200).json(response);

  } catch (err: any) {
    if (err.message === 'Invalid email or password') {
      res.status(401).json({ error: 'Invalid email or password' }); return;
    }
    if (err.message === 'Email not verified') {
      res.status(403).json({ error: 'Please verify your email before logging in', field: 'email' }); return;
    }
    if (err.message === 'Account is banned') {
      res.status(403).json({ error: 'Your account has been suspended' }); return;
    }
    logger.error({ err }, 'login failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ error: 'Refresh token required' }); return; }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;

    if (decoded.type !== 'refresh') {
      res.status(401).json({ error: 'Invalid token type' });
      return;
    }

    const user = await getUserById(decoded.userId);
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }

    const tokens = generateTokens(user.id, user.uuid);
    res.status(200).json(tokens);
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await getUserById(req.userId!);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const { password_hash, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'getMe failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};