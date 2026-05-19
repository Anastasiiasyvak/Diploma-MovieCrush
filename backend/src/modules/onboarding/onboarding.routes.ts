import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { getContent, checkStatus, complete } from './onboarding.controller';

const router = Router();

router.get('/content', authMiddleware, getContent);   
router.get('/status', authMiddleware, checkStatus);  
router.post('/complete', authMiddleware, complete);     

export default router;