import pool from '../../config/database';
import { fetchFromTMDB } from '../tmdb/tmdb.service';

const CF_SERVICE_URL = process.env.CF_SERVICE_URL ?? 'http://localhost:8000';

export interface AlsItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  release_date: string;
}

export interface AlsResponse {
  recommendations: AlsItem[];
  strategy: 'als';
  watched_count: number;
}

interface CfServiceResponse {
  user_id: number;
  recommendations: number[];
  count: number;
}

interface CacheRow {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string | null;
  poster_path: string | null;
  release_year: number | null;
  vote_average: number | null;
}

interface TmdbDetails {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  vote_average?: number;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
}

interface EnrichedItem extends CacheRow {
  vote_average: number;
}

const getWatchedCount = async (userId: number): Promise<number> => {
  const res = await pool.query(
    `SELECT COUNT(*) FROM user_movie_actions WHERE user_id = $1 AND is_watched = TRUE`,
    [userId]
  );
  return Number(res.rows[0].count);
};

const fetchAlsTmdbIds = async (userId: number, n = 40): Promise<number[]> => {
  const url = `${CF_SERVICE_URL}/recommend/${userId}?n=${n}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CF service error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as CfServiceResponse;
  return data.recommendations ?? [];
};

const enrichWithDetails = async (tmdbIds: number[]): Promise<AlsItem[]> => {
  if (tmdbIds.length === 0) return [];

  const cacheRes = await pool.query<CacheRow>(
    `SELECT tmdb_id, media_type, title, poster_path, release_year, vote_average
     FROM tmdb_media_cache
     WHERE tmdb_id = ANY($1::int[])`,
    [tmdbIds]
  );

  const cacheMap = new Map<number, CacheRow>(
    cacheRes.rows.map(r => [r.tmdb_id, r])
  );

  const missingIds = tmdbIds.filter(id => !cacheMap.has(id));

  if (missingIds.length > 0) {
    const fetchJobs = missingIds.map(id =>
      fetchFromTMDB<TmdbDetails>(`/movie/${id}`)
        .catch(() => fetchFromTMDB<TmdbDetails>(`/tv/${id}`).catch(() => null))
    );
    const fetched = await Promise.all(fetchJobs);

    for (let i = 0; i < missingIds.length; i++) {
      const d = fetched[i];
      if (!d) continue;
      const isMovie = !!(d as any).title;
      cacheMap.set(missingIds[i], {
        tmdb_id: missingIds[i],
        media_type: isMovie ? 'movie' : 'tv',
        title: (d as any).title ?? (d as any).name ?? null,
        poster_path: d.poster_path ?? null,
        vote_average: d.vote_average ?? 0,
        release_year: (d as any).release_date
          ? parseInt((d as any).release_date.slice(0, 4), 10)
          : (d as any).first_air_date
            ? parseInt((d as any).first_air_date.slice(0, 4), 10)
            : null,
      });
    }
  }

  const result: AlsItem[] = [];
  for (const id of tmdbIds) {
    const cached = cacheMap.get(id);
    if (!cached || !cached.title) continue;
    result.push({
      tmdb_id: id,
      media_type: cached.media_type,
      title: cached.title,
      poster_path: cached.poster_path,
      vote_average: cached.vote_average ?? 0,
      overview: '',
      release_date: cached.release_year ? `${cached.release_year}-01-01` : '',
    });
  }

  return result;
};

export const getAlsRecommendations = async (userId: number): Promise<AlsResponse> => {
  const watchedCount = await getWatchedCount(userId);

  let tmdbIds: number[] = [];
  try {
    tmdbIds = await fetchAlsTmdbIds(userId, 40);
  } catch (err) {
    console.error('[ALS] cf_service unavailable:', err);
    return { recommendations: [], strategy: 'als', watched_count: watchedCount };
  }

  if (tmdbIds.length === 0) {
    console.warn(`[ALS] No recommendations from cf_service for user ${userId}`);
    return { recommendations: [], strategy: 'als', watched_count: watchedCount };
  }

  const items = await enrichWithDetails(tmdbIds);

  return {
    recommendations: items.slice(0, 25),
    strategy: 'als',
    watched_count: watchedCount,
  };
};