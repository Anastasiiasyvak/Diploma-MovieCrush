import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { computeWrappedForUser, getWrappedSummary } from './wrapped.service';

const formatResponse = (row: any) => ({
  wrapped_year: Number(row.wrapped_year),
  computed_at:  row.computed_at,

  total_minutes: Number(row.total_minutes) || 0,
  total_hours:   Number(row.total_hours)   || 0,
  total_days:    Number(row.total_days)    || 0,

  cinema_vibe: row.cinema_vibe ?? null,
  cinema_vibe_stat: row.cinema_vibe_stat ?? null,

  movies_count:   Number(row.movies_count)   || 0,
  series_count:   Number(row.series_count)   || 0,
  episodes_count: Number(row.episodes_count) || 0,

  top_genre: row.top_genre_id ? {
    id: Number(row.top_genre_id),
    name: row.top_genre_name,
  } : null,

  top_director: row.top_director_id ? {
    id: Number(row.top_director_id),
    name: row.top_director_name,
  } : null,

  top_actors: row.top_actors || [],

  top_mood: row.top_mood ? {
    mood: row.top_mood,
    count: Number(row.mood_count) || 0,
  } : null,

  watch_habits: {
    weekday: row.top_weekday !== null ? Number(row.top_weekday) : null,
    hour:    row.top_hour    !== null ? Number(row.top_hour)    : null,
  },

  top_fan: row.topfan_actor_id ? {
    actor_id:   Number(row.topfan_actor_id),
    actor_name: row.topfan_actor_name,
    minutes:    Number(row.topfan_minutes) || 0,
    percentile: row.topfan_percentile !== null ? Number(row.topfan_percentile) : null,
  } : null,
});

export const getMyWrapped = async (req: AuthRequest, res: Response) => {
  try {
    const yearParam = req.query['year'] as string | undefined;
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    if (isNaN(year)) { res.status(400).json({ error: 'Invalid year' }); return; }

    const row = await getWrappedSummary(req.userId!, year);
    if (!row) {
      res.status(404).json({
        error: 'No wrapped summary yet for this year. Try recompute.',
      });
      return;
    }
    res.json(formatResponse(row));
  } catch (err) {
    console.error('getMyWrapped error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const recomputeMyWrapped = async (req: AuthRequest, res: Response) => {
  try {
    const year = new Date().getFullYear();
    await computeWrappedForUser(req.userId!, year);
    const row = await getWrappedSummary(req.userId!, year);
    if (!row) {
      res.status(200).json({ message: 'Recomputed but no data found.', wrapped: null });
      return;
    }
    res.json({ message: 'Wrapped recomputed', wrapped: formatResponse(row) });
  } catch (err) {
    console.error('recomputeMyWrapped error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};