import { Router } from 'express';
import { register, login, refreshToken, getMe } from './user.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.get('/me', authMiddleware, getMe);

export default router;