import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as ctrl from './recommendations.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', ctrl.getRecommendations);

export default router;