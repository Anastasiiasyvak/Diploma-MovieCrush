import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as ctrl from './wrapped.controller';

const router = Router();
router.use(authMiddleware);

router.get('/me', ctrl.getMyWrapped);
router.post('/recompute', ctrl.recomputeMyWrapped);

export default router;