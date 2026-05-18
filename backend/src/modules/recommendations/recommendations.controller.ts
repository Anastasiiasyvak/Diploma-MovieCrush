import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getAiRecommendationsForUser } from './recommendations.service';

export const getAiRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getAiRecommendationsForUser(req.userId!, false);
    res.json(data);
  } catch (err: any) {
    console.error('getAiRecommendations error:', err);

    if (err?.message?.startsWith('No watched movies')) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
};

export const refreshAiRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const data = await getAiRecommendationsForUser(req.userId!, true);
    res.json(data);
  } catch (err: any) {
    console.error('refreshAiRecommendations error:', err);
    if (err?.message?.startsWith('No watched movies')) {
      res.status(400).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
};