import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  getMe,
  verifyEmailHandler,
  checkVerified,
  forgotPassword,
  resetPasswordForm_handler,
  resetPasswordHandler,
} from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register',                  register);
router.post('/login',                     login);
router.post('/refresh',                   refreshToken);
router.get('/me',                         authMiddleware, getMe);
router.get('/verify/:token',              verifyEmailHandler);
router.get('/check-verified',             checkVerified);
router.post('/forgot-password',           forgotPassword);
router.get('/reset-password/:token',      resetPasswordForm_handler);  
router.post('/reset-password/:token',     resetPasswordHandler);     

export default router;