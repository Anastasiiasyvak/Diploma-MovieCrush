import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import {
  registerUser,
  loginUser,
  verifyEmail,
  checkEmailVerified,
  requestPasswordReset,
  resetPassword,
} from './auth.service';
import { getUserById } from '../shared/user.queries';
import { RegisterInput, LoginInput } from './auth.types';
import { AuthRequest } from '../../middleware/auth.middleware';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._]+$/;

export const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (password.length > 72) return 'Password must be less than 72 characters';
  return null;
};

const validateEmail = (email: string): string | null => {
  if (!email?.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address';
  if (email.length > 255) return 'Email is too long';
  return null;
};

const validateUsername = (username: string): string | null => {
  if (!username?.trim()) return 'Username is required';
  if (username.length < 3) return 'Username must be at least 3 characters';
  if (username.length > 30) return 'Username must be less than 30 characters';
  if (!USERNAME_REGEX.test(username)) return 'Username can only contain letters, numbers, dots and underscores';
  if (username.startsWith('.') || username.startsWith('_')) return 'Username cannot start with a dot or underscore';
  return null;
};

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

const verifySuccessPage = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MovieCrush — Email Verified</title>
  </head>
  <body style="margin:0;padding:0;background:#000;font-family:Arial,sans-serif;">
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;">
      <div style="background:#111;border-radius:16px;border:1px solid #222;padding:48px 40px;max-width:480px;width:100%;text-align:center;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffafcc;">MovieCrush</h1>
        <div style="font-size:48px;margin:24px 0;">🎬</div>
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#00cc66;">Email verified!</h2>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">Your account is now active.<br/>You can close this tab and return to the app.</p>
      </div>
    </div>
  </body>
</html>`;

const verifyErrorPage = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MovieCrush — Verification Failed</title>
  </head>
  <body style="margin:0;padding:0;background:#000;font-family:Arial,sans-serif;">
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;">
      <div style="background:#111;border-radius:16px;border:1px solid #222;padding:48px 40px;max-width:480px;width:100%;text-align:center;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffafcc;">MovieCrush</h1>
        <div style="font-size:48px;margin:24px 0;">❌</div>
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#ff4d4d;">Invalid or expired link</h2>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">This link is invalid or has already been used.<br/>Please try again.</p>
      </div>
    </div>
  </body>
</html>`;

const resetPasswordForm = (token: string, errorMessage?: string) => `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MovieCrush — Reset Password</title>
  </head>
  <body style="margin:0;padding:0;background:#000;font-family:Arial,sans-serif;">
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;">
      <div style="background:#111;border-radius:16px;border:1px solid #222;padding:48px 40px;max-width:480px;width:100%;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffafcc;text-align:center;">MovieCrush</h1>
        <h2 style="margin:24px 0 8px;font-size:20px;font-weight:700;color:#fff;text-align:center;">Create new password</h2>
        <p style="margin:0 0 ${errorMessage ? '16px' : '28px'};font-size:14px;color:rgba(255,255,255,0.5);text-align:center;">
          Min 8 characters, one uppercase, one number
        </p>
        ${errorMessage ? `
        <div style="background:rgba(255,77,77,0.12);border:1px solid rgba(255,77,77,0.4);border-radius:12px;padding:12px 16px;margin-bottom:20px;text-align:center;">
          <p style="margin:0;color:#ff4d4d;font-size:14px;">⚠ ${errorMessage}</p>
        </div>` : ''}
        <form method="POST" action="/api/auth/reset-password/${token}">
          <input type="password" name="password" placeholder="New password" required minlength="8"
            style="width:100%;box-sizing:border-box;background:transparent;border:2px solid #ffd700;border-radius:12px;padding:14px;color:#fff;font-size:16px;margin-bottom:12px;outline:none;"/>
          <input type="password" name="confirmPassword" placeholder="Confirm new password" required minlength="8"
            style="width:100%;box-sizing:border-box;background:transparent;border:2px solid #ffd700;border-radius:12px;padding:14px;color:#fff;font-size:16px;margin-bottom:24px;outline:none;"/>
          <button type="submit"
            style="width:100%;background:linear-gradient(135deg,#ffed4e,#ffd700);color:#000;font-size:16px;font-weight:700;border:none;padding:16px;border-radius:50px;cursor:pointer;letter-spacing:0.5px;">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  </body>
</html>`;

const resetSuccessPage = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MovieCrush — Password Updated</title>
  </head>
  <body style="margin:0;padding:0;background:#000;font-family:Arial,sans-serif;">
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;">
      <div style="background:#111;border-radius:16px;border:1px solid #222;padding:48px 40px;max-width:480px;width:100%;text-align:center;">
        <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#ffafcc;">MovieCrush</h1>
        <div style="font-size:48px;margin:24px 0;">✅</div>
        <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#00cc66;">Password updated!</h2>
        <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.6);line-height:1.6;">Your password has been changed.<br/>You can close this tab and log in to the app.</p>
      </div>
    </div>
  </body>
</html>`;


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

    await registerUser(input);

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (err: any) {
    if (err.message === 'Email already exists') {
      res.status(409).json({ error: 'This email is already registered', field: 'email' }); return;
    }
    if (err.message === 'Username already exists') {
      res.status(409).json({ error: 'This username is already taken', field: 'username' }); return;
    }
    console.error('Register error:', err);
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
    console.error('Verify email error:', err);
    res.status(500).send(verifyErrorPage);
  }
};

export const checkVerified = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email) { res.status(400).json({ error: 'Email is required' }); return; }

    const result = await checkEmailVerified(email.trim().toLowerCase());
    if (!result) { res.status(404).json({ verified: false }); return; }

    if (result.verified) {
      const { accessToken, refreshToken } = generateTokens(result.userId, result.uuid);
      res.status(200).json({ verified: true, accessToken, refreshToken });
    } else {
      res.status(200).json({ verified: false });
    }
  } catch (err) {
    console.error('Check verified error:', err);
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
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPasswordForm_handler = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    if (!token) { res.status(400).send(verifyErrorPage); return; }
    res.status(200).send(resetPasswordForm(token));
  } catch (err) {
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
    console.error('Reset password error:', err);
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

    res.status(200).json({ user: userWithoutPassword, accessToken, refreshToken });
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
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(400).json({ error: 'Refresh token required' }); return; }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
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
    res.status(500).json({ error: 'Internal server error' });
  }
};