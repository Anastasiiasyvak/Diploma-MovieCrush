import { Router } from 'express';
import { createList, deleteList, patchList } from './lists.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/lists', createList);
router.delete('/lists/:id', deleteList);
router.patch('/lists/:id', patchList);

export default router;