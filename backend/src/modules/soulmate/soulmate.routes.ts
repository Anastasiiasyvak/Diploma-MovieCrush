import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as ctrl from './soulmate.controller';

const router = Router();
router.use(authMiddleware);
router.get('/me', ctrl.getMyCurrentMatch);
router.post('/recompute', ctrl.recomputeMyMatch);

export default router;