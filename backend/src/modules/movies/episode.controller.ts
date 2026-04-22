import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  getWatchedEpisodes,
  toggleEpisodeWatch,
} from './episode.service';

export const fetchWatchedEpisodes = async (req: AuthRequest, res: Response) => {
  try {
    const seriesTmdbId = parseInt(req.params['seriesTmdbId'] as string, 10);
    if (isNaN(seriesTmdbId)) { res.status(400).json({ error: 'Invalid series tmdb_id' }); return; }
    const episodes = await getWatchedEpisodes(req.userId!, seriesTmdbId);
    res.json({ episodes });
  } catch (err) {
    console.error('fetchWatchedEpisodes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleEpisode = async (req: AuthRequest, res: Response) => {
  try {
    const {
      series_tmdb_id, season_number, episode_number,
      episode_tmdb_id, total_episodes_in_series, total_seasons_in_series,
    } = req.body;

    if (!series_tmdb_id || season_number === undefined || episode_number === undefined) {
      res.status(400).json({ error: 'series_tmdb_id, season_number, episode_number required' });
      return;
    }

    const result = await toggleEpisodeWatch(req.userId!, {
      series_tmdb_id, season_number, episode_number,
      episode_tmdb_id, total_episodes_in_series, total_seasons_in_series,
    });
    res.json(result);
  } catch (err) {
    console.error('toggleEpisode error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};