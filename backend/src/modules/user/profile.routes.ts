import { Router } from 'express';
import { getMyProfile, updateMyProfile, createList, deleteList, patchList } from './profile.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.post('/lists', createList);
router.delete('/lists/:id', deleteList);
router.patch('/lists/:id', patchList);

export default router;