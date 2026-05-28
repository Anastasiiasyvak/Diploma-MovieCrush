import { Request, Response } from 'express';
import { fetchFromTMDB } from './tmdb.service';
import pool from '../../config/database';
import { cacheMediaIfNeeded } from '../tmdb_cache/tmdb_cache.service';
import { parseTmdbId } from './tmdb.helpers';

// тут обробник помилок проксі
const handleError = (res: Response, err: unknown, context: string) => {
  console.error(`TMDB proxy error (${context}):`, err);
  res.status(502).json({ error: 'Failed to fetch from TMDB' });
};


export const getTrendingMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeWindow } = req.params;
    const data = await fetchFromTMDB(`/trending/movie/${timeWindow}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getTrendingMovies'); }
};

export const getTrendingSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { timeWindow } = req.params;
    const data = await fetchFromTMDB(`/trending/tv/${timeWindow}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getTrendingSeries'); }
};


export const getTopRatedMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page as string | undefined;
    const data = await fetchFromTMDB('/movie/top_rated', { page });
    res.json(data);
  } catch (err) { handleError(res, err, 'getTopRatedMovies'); }
};

export const getUpcomingMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page as string | undefined;
    const data = await fetchFromTMDB('/movie/upcoming', { page });
    res.json(data);
  } catch (err) { handleError(res, err, 'getUpcomingMovies'); }
};

export const getMovieDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieDetails'); }
};

export const getMovieCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/credits`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieCredits'); }
};

export const getMovieImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/images`, {
      include_image_language: 'en,null',
    });
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieImages'); }
};

export const getMovieVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/videos`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieVideos'); }
};

export const getSimilarMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/similar`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSimilarMovies'); }
};

export const getMovieRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/recommendations`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieRecommendations'); }
};

export const getMovieExternalIds = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/movie/${req.params.id}/external_ids`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getMovieExternalIds'); }
};


export const getTopRatedSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = req.query.page as string | undefined;
    const data = await fetchFromTMDB('/tv/top_rated', { page });
    res.json(data);
  } catch (err) { handleError(res, err, 'getTopRatedSeries'); }
};

export const getSeriesDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/tv/${req.params.id}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSeriesDetails'); }
};

export const getSeriesCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/tv/${req.params.id}/credits`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSeriesCredits'); }
};

export const getSeriesImages = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/tv/${req.params.id}/images`, {
      include_image_language: 'en,null',
    });
    res.json(data);
  } catch (err) { handleError(res, err, 'getSeriesImages'); }
};

export const getSeriesVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/tv/${req.params.id}/videos`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSeriesVideos'); }
};

export const getSimilarSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/tv/${req.params.id}/similar`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSimilarSeries'); }
};

export const getSeriesRecommendations = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/tv/${req.params.id}/recommendations`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSeriesRecommendations'); }
};

export const getSeasonDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, seasonNumber } = req.params;
    const data = await fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getSeasonDetail'); }
};

export const getEpisodeDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, seasonNumber, episodeNumber } = req.params;
    const data = await fetchFromTMDB(
      `/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`,
    );
    res.json(data);
  } catch (err) { handleError(res, err, 'getEpisodeDetail'); }
};


export const searchMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string | undefined;
    const page = req.query.page as string | undefined;
    if (!query) { res.status(400).json({ error: 'query is required' }); return; }
    const data = await fetchFromTMDB('/search/movie', { query, page });
    res.json(data);
  } catch (err) { handleError(res, err, 'searchMovies'); }
};

export const searchSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string | undefined;
    const page = req.query.page as string | undefined;
    if (!query) { res.status(400).json({ error: 'query is required' }); return; }
    const data = await fetchFromTMDB('/search/tv', { query, page });
    res.json(data);
  } catch (err) { handleError(res, err, 'searchSeries'); }
};

export const searchPeople = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.query as string | undefined;
    const page = req.query.page as string | undefined;
    if (!query) { res.status(400).json({ error: 'query is required' }); return; }
    const data = await fetchFromTMDB('/search/person', { query, page });
    res.json(data);
  } catch (err) { handleError(res, err, 'searchPeople'); }
};


export const discoverMovies = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.query as Record<string, string>;
    const data = await fetchFromTMDB('/discover/movie', params);
    res.json(data);
  } catch (err) { handleError(res, err, 'discoverMovies'); }
};

export const discoverSeries = async (req: Request, res: Response): Promise<void> => {
  try {
    const params = req.query as Record<string, string>;
    const data = await fetchFromTMDB('/discover/tv', params);
    res.json(data);
  } catch (err) { handleError(res, err, 'discoverSeries'); }
};


export const getPersonDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/person/${req.params.id}`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getPersonDetails'); }
};

export const getPersonCombinedCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fetchFromTMDB(`/person/${req.params.id}/combined_credits`);
    res.json(data);
  } catch (err) { handleError(res, err, 'getPersonCombinedCredits'); }
};


// Batch ендпоінт якй повертає метадані для списку одним запитом

interface BatchItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
}

interface BatchMeta {
  tmdb_id: number;
  title: string | null;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
}

const MAX_BATCH_SIZE = 50;

export const getMediaBatch = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawItems = req.body?.items;
    if (!Array.isArray(rawItems)) {
      res.status(400).json({ error: 'items array required' });
      return;
    }

    const items: BatchItem[] = [];
    for (const raw of rawItems.slice(0, MAX_BATCH_SIZE)) {
      if (!raw || (raw.media_type !== 'movie' && raw.media_type !== 'tv')) continue;
      const tmdbId = parseTmdbId(raw.tmdb_id);
      if (tmdbId === null) continue;
      items.push({ tmdb_id: tmdbId, media_type: raw.media_type });
    }

    if (items.length === 0) {
      res.json({ items: [] });
      return;
    }

    const readFromCache = async (): Promise<Map<string, BatchMeta>> => {
      const map = new Map<string, BatchMeta>();
      const tmdbIds = items.map(i => i.tmdb_id);
      const result = await pool.query(
        `SELECT tmdb_id, media_type, title, release_year, poster_path, vote_average
         FROM tmdb_media_cache
         WHERE tmdb_id = ANY($1::bigint[])`,
        [tmdbIds],
      );
      for (const row of result.rows) {
        map.set(`${row.tmdb_id}-${row.media_type}`, {
          tmdb_id: Number(row.tmdb_id),
          title: row.title ?? null,
          poster_path: row.poster_path ?? null,
          release_date: row.release_year ? String(row.release_year) : '',
          vote_average: row.vote_average !== null ? Number(row.vote_average) : 0,
          media_type: row.media_type,
        });
      }
      return map;
    };

    let cached = await readFromCache();

    const missing = items.filter(i => !cached.has(`${i.tmdb_id}-${i.media_type}`));
    for (const item of missing) {
      await cacheMediaIfNeeded(item.tmdb_id, item.media_type);
    }

    if (missing.length > 0) {
      cached = await readFromCache();
    }

    const result: BatchMeta[] = items.map(i => {
      const found = cached.get(`${i.tmdb_id}-${i.media_type}`);
      if (found) return found;
      return {
        tmdb_id: i.tmdb_id,
        title: null,
        poster_path: null,
        release_date: '',
        vote_average: 0,
        media_type: i.media_type,
      };
    });

    res.json({ items: result });
  } catch (err) {
    handleError(res, err, 'getMediaBatch');
  }
};