import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refreshToken,
  getMe,
  verifyEmailHandler,
  checkVerified,
  forgotPassword,
  resetPasswordPage,
  resetPasswordHandler,
} from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

// ліміт проти брутфорсу пароля й емейл бомбінгу
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 10,               
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

router.post('/register',                  register);
router.post('/login',                     authLimiter, login);
router.post('/refresh',                   refreshToken);
router.get('/me',                         authMiddleware, getMe);
router.get('/verify/:token',              verifyEmailHandler);
router.post('/check-verified',            checkVerified);
router.post('/forgot-password',           authLimiter, forgotPassword);
router.get('/reset-password/:token',      resetPasswordPage);
router.post('/reset-password/:token',     resetPasswordHandler);

export default router;