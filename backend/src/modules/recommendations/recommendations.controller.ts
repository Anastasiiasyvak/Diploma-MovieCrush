import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getAiRecommendationsForUser } from './recommendations.service';
import { getColdStartRecommendations } from './cold_start_service';
import { getAlsRecommendations } from './als_service';
import pool from '../../config/database';

const COLD_START_THRESHOLD = 20;

const getWatchedCount = async (userId: number): Promise<number> => {
  const res = await pool.query(
    `SELECT COUNT(*) FROM user_movie_actions WHERE user_id = $1 AND is_watched = TRUE`,
    [userId]
  );
  return Number(res.rows[0].count);
};

export const getRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const seed = Number(req.query.seed ?? 0);
    const watchedCount = await getWatchedCount(userId);

    if (watchedCount < COLD_START_THRESHOLD) {
      const data = await getColdStartRecommendations(userId, seed);
      res.json(data);
    } else {
      const data = await getAlsRecommendations(userId);

      if (data.recommendations.length === 0) {
        console.warn(`[Recs] ALS returned empty for user ${userId}, falling back to cold start`);
        const fallback = await getColdStartRecommendations(userId, seed);
        res.json(fallback);
        return;
      }

      res.json(data);
    }
  } catch (err: any) {
    console.error('getRecommendations error:', err);
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
};

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