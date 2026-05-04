import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { computeSoulmateForUser, getMyMatch } from './soulmate.service';
import { SoulmateResponse } from './soulmate.types';

const formatResponse = (row: any): SoulmateResponse => {
  const score = Number(row.similarity_score);
  return {
    matched_user: {
      id: Number(row.matched_id),
      username: row.matched_username,
      first_name: row.matched_first_name,
      last_name: row.matched_last_name,
      profile_image_url: row.matched_profile_image_url,
    },
    similarity_score: score,
    similarity_percent: Math.round(score * 100),
    breakdown: {
      rating: Number(row.rating_similarity),
      genre: Number(row.genre_similarity),
      actor: Number(row.actor_similarity),
      mood: Number(row.mood_similarity),
      director: Number(row.director_similarity),
      disliked: Number(row.disliked_similarity),
    },
    shared_movies_count: Number(row.shared_movies_count) || 0,
    top_shared_movies: (row.top_shared_movies || []).map((x: any) => Number(x)),
    shared_genres: row.shared_genres || [],
    shared_disliked: (row.shared_disliked || []).map((x: any) => Number(x)),
    wrapped_year: Number(row.wrapped_year),
    computed_at: row.computed_at,
  };
};

export const getMyCurrentMatch = async (req: AuthRequest, res: Response) => {
  try {
    const yearParam = req.query['year'] as string | undefined;
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    if (isNaN(year)) { res.status(400).json({ error: 'Invalid year' }); return; }

    const row = await getMyMatch(req.userId!, year);
    if (!row) {
      res.status(404).json({ error: 'No soulmate match yet for this year' });
      return;
    }

    res.json(formatResponse(row));
  } catch (err) {
    console.error('getMyCurrentMatch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const recomputeMyMatch = async (req: AuthRequest, res: Response) => {
  try {
    const year = new Date().getFullYear();
    const result = await computeSoulmateForUser(req.userId!, year);

    if (!result) {
      res.status(200).json({
        message: 'No soulmate found yet — try again when more users join MovieCrush!',
        match: null,
      });
      return;
    }

    const row = await getMyMatch(req.userId!, year);
    res.json({ message: 'Soulmate computed!', match: formatResponse(row) });
  } catch (err: any) {
    if (err.message === 'User did not consent to soulmate matching') {
      res.status(403).json({
        error: 'You need to enable soulmate matching in Settings first.',
      });
      return;
    }
    console.error('recomputeMyMatch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};