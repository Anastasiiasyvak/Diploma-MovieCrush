import pool from '../../config/database';
import { MediaType } from '../shared/user.types';
import { fetchFromTMDB } from '../tmdb/tmdb.service';
import { rerankWithGemini } from './recommendations.service';
import logger from '../../config/logger';

const CF_SERVICE_URL = process.env.CF_SERVICE_URL ?? 'http://localhost:8000';

const CF_RATIO_LOW  = 0.5;   // 25–50 переглянутих
const CF_RATIO_HIGH = 0.7;   // 50+ переглянутих
const CANDIDATE_POOL = 40;   // скільки тягнемо з кожного джерела

export interface AlsItem {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  release_date: string;
}

export interface TaggedItem extends AlsItem {
  source: 'als' | 'discover';
}

export interface PersonalizedItem {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  release_date: string;
  category?: 'strong_match' | 'diversity' | 'hidden_gem';
}

export interface PersonalizedResponse {
  recommendations: PersonalizedItem[];
  strategy: 'personalized';
  watched_count: number;
  cached: boolean;
  computed_at: string;
  model_used: string;
}

interface CfServiceResponse {
  user_id: number;
  recommendations: number[];
  count: number;
}

export interface CacheRow {
  tmdb_id: number;
  media_type: MediaType;
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

interface TmdbDiscoverResult {
  results: Array<{
    id: number;
    title?: string;
    name?: string;
    poster_path?: string | null;
    vote_average?: number;
    overview?: string;
    release_date?: string;
    first_air_date?: string;
  }>;
}

type ContentBucket = 'movie' | 'tv' | 'anime' | 'anime_movie' | 'dorama' | 'animation';

const getContentBucket = (m: { tmdb_id: number; genre: string; media_type: MediaType }): ContentBucket => {
  const g = m.genre.toLowerCase();
  if (m.media_type === 'tv') {
    if (g === 'anime') return 'anime';
    if (g === 'k-drama') return 'dorama';
    return 'tv';
  }
  if (g === 'anime') return 'anime_movie';
  if (g === 'animation') return 'animation';
  return 'movie';
};

interface UserProfile {
  topGenreIds: number[];
  topActorId: number | null;
  allowedBuckets: Set<ContentBucket>; 
}

export const mediaTypeFromTmdb = (d: { title?: string; name?: string }): MediaType =>
  !!d.title ? 'movie' : 'tv';

export const releaseYearFromTmdb = (d: { release_date?: string; first_air_date?: string }): number | null => {
  if (d.release_date) return parseInt(d.release_date.slice(0, 4), 10) || null;
  if (d.first_air_date) return parseInt(d.first_air_date.slice(0, 4), 10) || null;
  return null;
};

export const cacheRowToAlsItem = (id: number, cached: CacheRow): AlsItem => ({
  tmdb_id: id,
  media_type: cached.media_type,
  title: cached.title!,
  poster_path: cached.poster_path,
  vote_average: cached.vote_average ?? 0,
  overview: '',
  release_date: cached.release_year ? `${cached.release_year}-01-01` : '',
});

export const filterValidItems = (ids: number[], cacheMap: Map<number, CacheRow>): AlsItem[] => {
  const result: AlsItem[] = [];
  for (const id of ids) {
    const cached = cacheMap.get(id);
    if (!cached || !cached.title) {
      logger.warn({ tmdbId: id }, 'filterValidItems: skipping tmdb_id missing from cache or without title');
      continue;
    }
    result.push(cacheRowToAlsItem(id, cached));
  }
  return result;
};

export const sliceToLimit = (items: AlsItem[], limit = 25): AlsItem[] =>
  items.slice(0, limit);

export const getCfRatio = (watchedCount: number): number =>
  watchedCount >= 50 ? CF_RATIO_HIGH : CF_RATIO_LOW;

const getWatchedCount = async (userId: number): Promise<number> => {
  const res = await pool.query(
    `SELECT COUNT(*) FROM user_movie_actions WHERE user_id = $1 AND is_watched = TRUE`,
    [userId]
  );
  return Number(res.rows[0].count);
};

const getExcludedIds = async (userId: number): Promise<Set<number>> => {
  const res = await pool.query(
    `SELECT DISTINCT tmdb_id FROM user_movie_actions
     WHERE user_id = $1 AND (is_watched = TRUE OR is_disliked = TRUE)`,
    [userId]
  );
  return new Set(res.rows.map((r: any) => Number(r.tmdb_id)));
};

const getUserProfile = async (userId: number): Promise<UserProfile> => {
  const genreRes = await pool.query(
    `SELECT genre_id, COUNT(*)::int AS cnt
     FROM (
       SELECT unnest(c.genre_ids) AS genre_id
       FROM user_movie_actions uma
       JOIN tmdb_media_cache c ON c.tmdb_id = uma.tmdb_id
       WHERE uma.user_id = $1 AND uma.is_watched = TRUE
         AND c.genre_ids IS NOT NULL
     ) sub
     GROUP BY genre_id
     ORDER BY cnt DESC
     LIMIT 3`,
    [userId]
  );
  const topGenreIds: number[] = genreRes.rows.map((r: any) => Number(r.genre_id));

  const actorRes = await pool.query(
    `SELECT actor_tmdb_id, COUNT(*)::int AS votes
     FROM user_best_actor_votes
     WHERE user_id = $1
     GROUP BY actor_tmdb_id
     ORDER BY votes DESC
     LIMIT 1`,
    [userId]
  );
  const topActorId = actorRes.rows.length > 0 ? Number(actorRes.rows[0].actor_tmdb_id) : null;

  const onboardingRes = await pool.query(
    `SELECT om.tmdb_id, om.genre, om.media_type,
            (uo.ratings ->> om.tmdb_id::text)::int AS rating
     FROM onboarding_movies om
     JOIN user_onboarding uo ON uo.user_id = $1
     WHERE om.tmdb_id = ANY(
       SELECT unnest(uo.watched_tmdb_ids)
     )`,
    [userId]
  );
  const allowedBuckets = new Set<ContentBucket>();
  for (const row of onboardingRes.rows) {
    const rating = row.rating !== null && row.rating !== undefined ? Number(row.rating) : null;
    if (rating !== null && rating < 6) continue;
    allowedBuckets.add(getContentBucket({ tmdb_id: row.tmdb_id, genre: row.genre, media_type: row.media_type }));
  }
  if (allowedBuckets.size === 0) {
    allowedBuckets.add('movie');
    allowedBuckets.add('tv');
  }

  return { topGenreIds, topActorId, allowedBuckets };
};

const fetchAlsTmdbIds = async (userId: number, n = CANDIDATE_POOL): Promise<number[]> => {
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
        .catch(() => fetchFromTMDB<TmdbDetails>(`/tv/${id}`).catch((err) => {
          logger.warn({ err, tmdbId: id }, '[ALS] TMDB details failed (movie and tv)');
          return null;
        }))
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
    if (!cached || !cached.title) {
      logger.warn({ tmdbId: id }, 'enrichWithDetails: skipping tmdb_id missing from cache or without title');
      continue;
    }
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

const fetchDiscoverCandidates = async (
  profile: UserProfile,
  excludedIds: Set<number>,
): Promise<AlsItem[]> => {
  const jobs: Promise<TmdbDiscoverResult>[] = [];
  const { topGenreIds, topActorId, allowedBuckets } = profile;

  const genreStr = topGenreIds.join('|');
  const baseMovieParams: Record<string, string> = {
    sort_by: 'vote_average.desc',
    'vote_count.gte': '200',
    without_genres: '99',
  };
  const baseTvParams: Record<string, string> = {
    sort_by: 'vote_average.desc',
    'vote_count.gte': '100',
    without_genres: '99',
  };

  if (genreStr) {
    // Звичайні фільми — виключаємо анімацію (16) та ja/ko-мову,
    // щоб аніме/азійський контент не лізли у фільмовий бакет
    if (allowedBuckets.has('movie')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/movie', { ...baseMovieParams, with_genres: genreStr, without_genres: '99,16', without_original_language: 'ja,ko', page: '1' }).catch((err) => { logger.warn({ err }, '[ALS] TMDB discover failed, using empty fallback'); return { results: [] }; }));
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/movie', { ...baseMovieParams, with_genres: genreStr, without_genres: '99,16', without_original_language: 'ja,ko', page: '2' }).catch((err) => { logger.warn({ err }, '[ALS] TMDB discover failed, using empty fallback'); return { results: [] }; }));
    }
    // Аніме фільми
    if (allowedBuckets.has('anime_movie')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/movie', { ...baseMovieParams, with_genres: '16', with_original_language: 'ja', page: '1' }).catch((err) => { logger.warn({ err }, '[ALS] TMDB discover failed, using empty fallback'); return { results: [] }; }));
    }
    // Анімація (не аніме)
    if (allowedBuckets.has('animation')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/movie', { ...baseMovieParams, with_genres: '16', without_original_language: 'ja', page: '1' }).catch((err) => { logger.warn({ err }, '[ALS] TMDB discover failed, using empty fallback'); return { results: [] }; }));
    }
    // Звичайні серіали
    if (allowedBuckets.has('tv')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/tv', { ...baseTvParams, with_genres: genreStr, without_genres: '99,16', without_original_language: 'ja,ko', page: '1' }).catch((err) => { logger.warn({ err }, '[ALS] TMDB discover failed, using empty fallback'); return { results: [] }; }));
    }
    // Аніме серіали
    if (allowedBuckets.has('anime')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/tv', { ...baseTvParams, with_genres: '16', with_original_language: 'ja', page: '1' }).catch((err) => { logger.warn({ err }, '[ALS] TMDB discover failed, using empty fallback'); return { results: [] }; }));
    }
    // Дорама
    if (allowedBuckets.has('dorama')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/tv', { ...baseTvParams, with_genres: genreStr, with_original_language: 'ko', page: '1' }).catch((err) => { logger.warn({ err }, '[ALS] TMDB discover failed, using empty fallback'); return { results: [] }; }));
    }
  }

  if (topActorId) {
    const endpoint = allowedBuckets.has('movie') || allowedBuckets.has('anime_movie') || allowedBuckets.has('animation')
      ? '/discover/movie' : '/discover/tv';
    jobs.push(
      fetchFromTMDB<TmdbDiscoverResult>(endpoint, {
        ...baseMovieParams,
        with_cast: String(topActorId),
        sort_by: 'popularity.desc',
      }).catch((err) => { logger.warn({ err }, '[ALS] TMDB discover failed, using empty fallback'); return { results: [] }; })
    );
  }

  const results = await Promise.all(jobs);
  const items: AlsItem[] = [];
  const seen = new Set<number>();

  for (const r of results) {
    for (const item of r.results ?? []) {
      if (seen.has(item.id) || excludedIds.has(item.id)) continue;
      seen.add(item.id);
      items.push({
        tmdb_id: item.id,
        media_type: item.title ? 'movie' : 'tv',
        title: item.title ?? item.name ?? 'Unknown',
        poster_path: item.poster_path ?? null,
        vote_average: item.vote_average ?? 0,
        overview: item.overview ?? '',
        release_date: item.release_date ?? item.first_air_date ?? '',
      });
    }
  }

  return items.slice(0, 20);  
};

const tagCandidates = (
  alsItems: AlsItem[],
  discoverItems: AlsItem[],
  excludedIds: Set<number>,
): TaggedItem[] => {
  const seen = new Set<number>();
  const result: TaggedItem[] = [];

  const addTagged = (items: AlsItem[], source: 'als' | 'discover') => {
    for (const item of items) {
      if (seen.has(item.tmdb_id) || excludedIds.has(item.tmdb_id)) continue;
      seen.add(item.tmdb_id);
      result.push({ ...item, source });
    }
  };

  addTagged(alsItems, 'als');
  addTagged(discoverItems, 'discover');

  return result;
};

export const getPersonalizedRecommendations = async (
  userId: number,
): Promise<PersonalizedResponse> => {
  const watchedCount = await getWatchedCount(userId);
  const excludedIds = await getExcludedIds(userId);
  const profile = await getUserProfile(userId);

  logger.debug(`\n${'═'.repeat(60)}`);
  logger.debug(`[Personalized] User ${userId} | watched: ${watchedCount} | CF ratio: ${getCfRatio(watchedCount) * 100}%`);
  logger.debug(`[Personalized] Profile → genres: [${profile.topGenreIds.join(', ')}] | top actor: ${profile.topActorId ?? 'none'}`);
  logger.debug(`[Personalized] Allowed buckets: [${[...profile.allowedBuckets].join(', ')}]`);

  const [alsItems, discoverItems] = await Promise.all([
    fetchAlsTmdbIds(userId, CANDIDATE_POOL)
      .then(async ids => {
        logger.debug(`[Personalized] ALS from CF service: ${ids.length} ids (already filtered)`);
        return enrichWithDetails(ids);
      })
      .catch(err => {
        logger.error({ err, userId }, '[Personalized] ALS failed');
        return [] as AlsItem[];
      }),
    fetchDiscoverCandidates(profile, excludedIds),
  ]);

  logger.debug(`[Personalized] ALS enriched: ${alsItems.length} | Discover: ${discoverItems.length}`);

  const taggedCandidates = tagCandidates(alsItems, discoverItems, excludedIds);

  const alsCount = taggedCandidates.filter(c => c.source === 'als').length;
  const discoverCount = taggedCandidates.filter(c => c.source === 'discover').length;
  logger.debug(`[Personalized] Total candidates for Gemini: ${taggedCandidates.length} (ALS: ${alsCount}, Discover: ${discoverCount})`);

  const result = await rerankWithGemini(userId, taggedCandidates, watchedCount);

  return result;
};