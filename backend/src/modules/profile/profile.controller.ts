import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getUserProfile, updateUserProfile } from './profile.service';
import { UpdateProfileInput } from './profile.types';
import logger from '../../config/logger';

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await getUserProfile(req.userId!);
    if (!profile) { res.status(404).json({ error: 'User not found' }); return; }
    res.status(200).json(profile);
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'Get profile failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const input: UpdateProfileInput = req.body;
    if (input.instagram_username)
      input.instagram_username = input.instagram_username.replace(/^@/, '').trim() || undefined;
    if (input.telegram_username)
      input.telegram_username = input.telegram_username.replace(/^@/, '').trim() || undefined;
    const user = await updateUserProfile(req.userId!, input);
    if (!user) { res.status(400).json({ error: 'Nothing to update' }); return; }
    res.status(200).json({ user });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'Update profile failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};