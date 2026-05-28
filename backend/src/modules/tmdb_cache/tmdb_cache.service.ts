import pool from '../../config/database';
import { fetchFromTMDB } from '../tmdb/tmdb.service';

interface CastMember {
  tmdb_id: number;
  name: string;
}

interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
}

interface TmdbCastMember {
  id: number;
  name: string;
}

interface TmdbCredits {
  cast?: TmdbCastMember[];
  crew?: TmdbCrewMember[];
}

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovieDetails {
  id: number;
  title: string;
  release_date?: string;
  runtime?: number;
  poster_path?: string | null;
  genres?: TmdbGenre[];
  vote_average?: number;
}

interface TmdbCreator {
  id: number;
  name: string;
}

interface TmdbSeriesDetails {
  id: number;
  name: string;
  first_air_date?: string;
  episode_run_time?: number[];
  poster_path?: string | null;
  genres?: TmdbGenre[];
  created_by?: TmdbCreator[];
  vote_average?: number;
}

const isNotFound = (err: unknown): boolean =>
  err instanceof Error && err.message.includes('404');

export const cacheMediaIfNeeded = async (
  tmdbId: number,
  mediaType: 'movie' | 'tv'
): Promise<void> => {
  try {
    const existing = await pool.query(
      `SELECT tmdb_id FROM tmdb_media_cache
       WHERE tmdb_id = $1 AND media_type = $2`,
      [tmdbId, mediaType]
    );
    if (existing.rows.length > 0) return;

    const primary = mediaType;
    const secondary: 'movie' | 'tv' = mediaType === 'movie' ? 'tv' : 'movie';

    const cacheFor = (type: 'movie' | 'tv') =>
      type === 'movie' ? cacheMovie(tmdbId) : cacheSeries(tmdbId);

    try {
      await cacheFor(primary);
    } catch (err) {
      if (isNotFound(err)) {
        await cacheFor(secondary);
      } else {
        throw err;
      }

    }
  } catch (err) {
    console.error(`cacheMediaIfNeeded(${tmdbId}, ${mediaType}) failed:`, err);
  }
};

const cacheMovie = async (tmdbId: number): Promise<void> => {
  const [details, credits] = await Promise.all([
    fetchFromTMDB<TmdbMovieDetails>(`/movie/${tmdbId}`),
    fetchFromTMDB<TmdbCredits>(`/movie/${tmdbId}/credits`),
  ]);

  const releaseYear = details.release_date
    ? parseInt(details.release_date.slice(0, 4), 10)
    : null;

  const director = credits.crew?.find(c => c.job === 'Director');
  const topCast: CastMember[] = (credits.cast ?? [])
    .slice(0, 10)
    .map(c => ({ tmdb_id: c.id, name: c.name }));

  const genreIds: number[] = (details.genres ?? []).map(g => g.id);

  await pool.query(
    `INSERT INTO tmdb_media_cache (
       tmdb_id, media_type, title, release_year, runtime_minutes,
       poster_path, genre_ids, director_tmdb_id, director_name, top_cast, vote_average
     ) VALUES ($1, 'movie', $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
     ON CONFLICT (tmdb_id, media_type) DO NOTHING`,
    [
      tmdbId,
      details.title ?? null,
      releaseYear,
      details.runtime ?? null,
      details.poster_path ?? null,
      genreIds,
      director?.id ?? null,
      director?.name ?? null,
      JSON.stringify(topCast),
      details.vote_average ?? 0,
    ]
  );
};

const cacheSeries = async (tmdbId: number): Promise<void> => {
  const [details, credits] = await Promise.all([
    fetchFromTMDB<TmdbSeriesDetails>(`/tv/${tmdbId}`),
    fetchFromTMDB<TmdbCredits>(`/tv/${tmdbId}/credits`),
  ]);

  const releaseYear = details.first_air_date
    ? parseInt(details.first_air_date.slice(0, 4), 10)
    : null;

  const runtime = Array.isArray(details.episode_run_time) && details.episode_run_time.length > 0
    ? details.episode_run_time[0]
    : 45;

  const creator = details.created_by?.[0];
  const topCast: CastMember[] = (credits.cast ?? [])
    .slice(0, 10)
    .map(c => ({ tmdb_id: c.id, name: c.name }));

  const genreIds: number[] = (details.genres ?? []).map(g => g.id);

  await pool.query(
    `INSERT INTO tmdb_media_cache (
       tmdb_id, media_type, title, release_year, runtime_minutes,
       poster_path, genre_ids, director_tmdb_id, director_name, top_cast, vote_average
     ) VALUES ($1, 'tv', $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
     ON CONFLICT (tmdb_id, media_type) DO NOTHING`,
    [
      tmdbId,
      details.name ?? null,
      releaseYear,
      runtime,
      details.poster_path ?? null,
      genreIds,
      creator?.id ?? null,
      creator?.name ?? null,
      JSON.stringify(topCast),
      details.vote_average ?? 0,
    ]
  );
};