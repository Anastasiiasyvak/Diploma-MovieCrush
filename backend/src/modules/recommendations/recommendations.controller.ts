import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getColdStartRecommendations } from './cold_start_service';
import { getPersonalizedRecommendations } from './als_service';
import pool from '../../config/database';
import logger from '../../config/logger';

const PERSONALIZED_THRESHOLD = 25;

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

    if (watchedCount < PERSONALIZED_THRESHOLD) {
      const data = await getColdStartRecommendations(userId, seed);
      res.json(data);
      return;
    }

    try {
      const data = await getPersonalizedRecommendations(userId);
      res.json(data);
    } catch (err: any) {
      logger.warn({ err, userId }, 'Personalized recommendations failed, falling back to cold start');
      const fallback = await getColdStartRecommendations(userId, seed);
      res.json(fallback);
    }
  } catch (err: any) {
    logger.error({ err }, 'getRecommendations failed');
    res.status(500).json({ error: err?.message || 'Internal server error' });
  }
};