import { Router } from 'express';
import {
  patchUsername,
  patchName,
  patchPassword,
  patchSocials,
  patchSoulmate,
  patchLanguage,
  deleteAccount,
} from './settings.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.patch('/username',  patchUsername);
router.patch('/name',      patchName);
router.patch('/password',  patchPassword);
router.patch('/socials',   patchSocials);
router.patch('/soulmate',  patchSoulmate);
router.patch('/language',  patchLanguage);
router.delete('/account',  deleteAccount);

export default router;