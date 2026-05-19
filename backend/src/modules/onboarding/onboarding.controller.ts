import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  getOnboardingContent,
  hasCompletedOnboarding,
  completeOnboarding,
} from './onboarding.service';

export const getContent = async (req: AuthRequest, res: Response) => {
  try {
    const batch = Number(req.query.batch) || 1;
    const content = await getOnboardingContent(batch);
    res.json(content);
  } catch (err: any) {
    console.error('getOnboardingContent error:', err);
    res.status(500).json({ error: 'Failed to load onboarding content' });
  }
};

export const checkStatus = async (req: AuthRequest, res: Response) => {
  try {
    const completed = await hasCompletedOnboarding(req.userId!);
    res.json({ completed });
  } catch (err: any) {
    console.error('checkOnboardingStatus error:', err);
    res.status(500).json({ error: 'Failed to check onboarding status' });
  }
};

export const complete = async (req: AuthRequest, res: Response) => {
  try {
    const { liked_actor_ids, watched_tmdb_ids, ratings } = req.body;

    await completeOnboarding(req.userId!, {
      liked_actor_ids,
      watched_tmdb_ids: watched_tmdb_ids ?? [],
      ratings: ratings ?? {},
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error('completeOnboarding error:', err);
    res.status(500).json({ error: 'Failed to save onboarding data' });
  }
};