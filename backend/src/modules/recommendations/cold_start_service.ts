import pool from '../../config/database';
import { fetchFromTMDB } from '../tmdb/tmdb.service';

interface OnboardingData {
  liked_actor_ids: number[];
  watched_tmdb_ids: number[];
  ratings: Record<string, number>;
}

interface OnboardingMovie {
  tmdb_id: number;
  genre: string;
  media_type: 'movie' | 'tv';
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
  total_pages?: number;
}

export interface ColdStartItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  release_date: string;
}

export interface ColdStartResponse {
  recommendations: ColdStartItem[];
  strategy: 'cold_start';
  watched_count: number;
}

const BATCH_SIZE = 25;
const ACTOR_SLOTS = 10;
const GENRE_SLOTS = 10;
const POPULAR_SLOTS = 5;

const GENRE_TO_TMDB: Record<string, number[]> = {
  'Drama': [18],
  'Thriller': [53],
  'Action': [28],
  'Comedy': [35],
  'Romance': [10749],
  'Sci-Fi': [878],
  'Horror': [27],
  'Animation': [16],
  'Anime': [16],
  'Fantasy': [14],
  'Crime': [80],
  'Adventure': [12],
  'Family': [10751],
  'History': [36],
  'Mystery': [9648],
  'War': [10752],
  'K-Drama': [18],
  'Series': [18],
};

type ContentBucket = 'movie' | 'tv' | 'anime' | 'anime_movie' | 'dorama' | 'animation';

const getContentBucket = (m: OnboardingMovie): ContentBucket => {
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

const getAllowedBuckets = (movies: OnboardingMovie[]): Set<ContentBucket> => {
  const buckets = new Set<ContentBucket>();
  for (const m of movies) buckets.add(getContentBucket(m));
  return buckets;
};

const tmdbItemToColdStart = (item: TmdbDiscoverResult['results'][0]): ColdStartItem => ({
  tmdb_id: item.id,
  media_type: item.title ? 'movie' : 'tv',
  title: item.title ?? item.name ?? 'Unknown',
  poster_path: item.poster_path ?? null,
  vote_average: item.vote_average ?? 0,
  overview: item.overview ?? '',
  release_date: item.release_date ?? item.first_air_date ?? '',
});

const getWatchedCount = async (userId: number): Promise<number> => {
  const res = await pool.query(
    `SELECT COUNT(*) FROM user_movie_actions WHERE user_id = $1 AND is_watched = TRUE`,
    [userId]
  );
  return Number(res.rows[0].count);
};

const getOnboardingData = async (userId: number): Promise<OnboardingData | null> => {
  const res = await pool.query(
    `SELECT liked_actor_ids, watched_tmdb_ids, ratings FROM user_onboarding WHERE user_id = $1`,
    [userId]
  );
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    liked_actor_ids: row.liked_actor_ids ?? [],
    watched_tmdb_ids: row.watched_tmdb_ids ?? [],
    ratings: typeof row.ratings === 'object' ? row.ratings : JSON.parse(row.ratings ?? '{}'),
  };
};

const getOnboardingMovies = async (tmdbIds: number[]): Promise<OnboardingMovie[]> => {
  if (tmdbIds.length === 0) return [];
  const res = await pool.query(
    `SELECT tmdb_id, genre, media_type FROM onboarding_movies WHERE tmdb_id = ANY($1::int[])`,
    [tmdbIds]
  );
  return res.rows;
};

const computeGenreWeights = (
  movies: OnboardingMovie[],
  ratings: Record<string, number>,
): Map<number, number> => {
  const weights = new Map<number, number>();
  for (const movie of movies) {
    const rating = ratings[String(movie.tmdb_id)] ?? null;
    const weight = rating !== null ? (rating >= 8 ? 3 : rating >= 6 ? 2 : 1) : 1;
    for (const gId of GENRE_TO_TMDB[movie.genre] ?? []) {
      weights.set(gId, (weights.get(gId) ?? 0) + weight);
    }
  }
  return weights;
};

const getTopGenreIds = (weights: Map<number, number>, n: number): number[] =>
  [...weights.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id]) => id);

const buildBatch = (
  byActors: ColdStartItem[],
  byGenres: ColdStartItem[],
  byPopular: ColdStartItem[],
  excludedIds: Set<number>,
): ColdStartItem[] => {
  const seen = new Set<number>();
  const result: ColdStartItem[] = [];

  const addItems = (items: ColdStartItem[], limit: number) => {
    let added = 0;
    for (const item of items) {
      if (added >= limit) break;
      if (!seen.has(item.tmdb_id) && !excludedIds.has(item.tmdb_id)) {
        seen.add(item.tmdb_id);
        result.push(item);
        added++;
      }
    }
  };

  addItems(byActors, ACTOR_SLOTS);
  addItems(byGenres, GENRE_SLOTS);
  addItems(byPopular, POPULAR_SLOTS);

  // Добираємо якщо якийсь бакет дав мало
  if (result.length < BATCH_SIZE) {
    addItems([...byGenres, ...byActors, ...byPopular], BATCH_SIZE - result.length);
  }

  return result;
};

const fetchByActors = async (
  actorIds: number[],
  allowedBuckets: Set<ContentBucket>,
  genreIds: number[],
  seed: number,
  slotsPerActor: number,
  excludedIds: Set<number>,
  minVoteAvg?: string,
): Promise<ColdStartItem[]> => {
  if (actorIds.length === 0) return [];

  const page = String((seed % 10) + 1);
  const isMovieBucket = allowedBuckets.has('movie') || allowedBuckets.has('anime_movie') || allowedBuckets.has('animation');
  const endpoint = isMovieBucket ? '/discover/movie' : '/discover/tv';

  const jobs = actorIds.map(actorId => {
    const params: Record<string, string> = {
      with_cast: String(actorId),
      sort_by: 'popularity.desc',
      without_genres: '99',
      'vote_count.gte': '100',
      page,
    };
    if (minVoteAvg) params['vote_average.gte'] = minVoteAvg;
    return fetchFromTMDB<TmdbDiscoverResult>(endpoint, params)
      .catch(() => ({ results: [] as TmdbDiscoverResult['results'] }));
  });

  const results = await Promise.all(jobs);
  const items: ColdStartItem[] = [];
  const seen = new Set<number>();

  for (const r of results) {
    let taken = 0;
    for (const item of r.results ?? []) {
      if (taken >= slotsPerActor) break;
      if (!excludedIds.has(item.id) && !seen.has(item.id)) {
        seen.add(item.id);
        items.push(tmdbItemToColdStart(item));
        taken++;
      }
    }
  }

  // фолбек без жанру якщо мало результатів
  if (items.length < actorIds.length * 2 && genreIds.length > 0) {
    const fallbackJobs = actorIds.map(actorId => {
      const params: Record<string, string> = {
        with_cast: String(actorId),
        sort_by: 'vote_average.desc',
        'vote_count.gte': '300',
        without_genres: '99',
        page: '1', 
      };
      if (minVoteAvg) params['vote_average.gte'] = minVoteAvg;
      return fetchFromTMDB<TmdbDiscoverResult>(endpoint, params)
        .catch(() => ({ results: [] as TmdbDiscoverResult['results'] }));
    });
    const fallbackResults = await Promise.all(fallbackJobs);
    for (const r of fallbackResults) {
      let taken = 0;
      for (const item of r.results ?? []) {
        if (taken >= slotsPerActor) break;
        if (!excludedIds.has(item.id) && !seen.has(item.id)) {
          seen.add(item.id);
          items.push(tmdbItemToColdStart(item));
          taken++;
        }
      }
    }
  }

  return items;
};

const fetchByGenres = async (
  genreIds: number[],
  allowedBuckets: Set<ContentBucket>,
  seed: number,
  excludedIds: Set<number>,
  minVoteAvg?: string,
): Promise<ColdStartItem[]> => {
  if (genreIds.length === 0) return [];

  const page = String((seed % 10) + 1);
  const genreStr = genreIds.join('|');
  const jobs: Promise<TmdbDiscoverResult>[] = [];

  const pages = [
    String((seed % 10) + 1),
    String(((seed + 3) % 10) + 1),
    String(((seed + 6) % 10) + 1),
  ];

  const baseParams = (extra: Record<string, string> = {}, p = page): Record<string, string> => ({
    with_genres: genreStr,
    sort_by: 'vote_average.desc',
    'vote_count.gte': '200',
    without_genres: '99',
    page: p,
    ...(minVoteAvg ? { 'vote_average.gte': minVoteAvg } : {}),
    ...extra,
  });

  for (const p of pages) {
    if (allowedBuckets.has('movie')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/movie', baseParams({}, p)).catch(() => ({ results: [] })));
    }
    if (allowedBuckets.has('animation')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/movie', baseParams({
        without_original_language: 'ja',
        without_keywords: '210024',
      }, p)).catch(() => ({ results: [] })));
    }
    if (allowedBuckets.has('anime_movie')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/movie', {
        with_genres: '16', with_original_language: 'ja',
        sort_by: 'vote_average.desc', 'vote_count.gte': '100', page: p,
      }).catch(() => ({ results: [] })));
    }
    if (allowedBuckets.has('tv')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/tv', baseParams({
        without_keywords: '210024', without_original_language: 'ja',
      }, p)).catch(() => ({ results: [] })));
    }
    if (allowedBuckets.has('anime')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/tv', {
        with_genres: '16', with_original_language: 'ja',
        sort_by: 'vote_average.desc', 'vote_count.gte': '100', page: p,
      }).catch(() => ({ results: [] })));
    }
    if (allowedBuckets.has('dorama')) {
      jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/tv', {
        with_genres: '18', with_original_language: 'ko',
        sort_by: 'vote_average.desc', 'vote_count.gte': '100', page: p,
      }).catch(() => ({ results: [] })));
    }
  }

  const results = await Promise.all(jobs);
  const items: ColdStartItem[] = [];
  const seen = new Set<number>();

  // Інтерлівінг щоб рівний розподіл між типами
  const maxLen = Math.max(...results.map(r => (r as any).results?.length ?? 0));
  for (let i = 0; i < maxLen; i++) {
    for (const r of results) {
      const item = (r as any).results?.[i];
      if (item && !seen.has(item.id) && !excludedIds.has(item.id)) {
        seen.add(item.id);
        items.push(tmdbItemToColdStart(item));
      }
    }
  }

  return items;
};

const fetchPopularByBuckets = async (
  allowedBuckets: Set<ContentBucket>,
  genreIds: number[],
  seed: number,
  excludedIds: Set<number>,
): Promise<ColdStartItem[]> => {
  const page     = String((seed % 5) + 1);
  const genreStr = genreIds.length > 0 ? genreIds.join('|') : undefined;
  const jobs: Promise<TmdbDiscoverResult>[] = [];

  const discoverParams = (extra: Record<string, string> = {}): Record<string, string> => ({
    sort_by: 'vote_average.desc',
    'vote_count.gte': '200',
    without_genres: '99',
    page,
    ...(genreStr ? { with_genres: genreStr } : {}),
    ...extra,
  });

  if (allowedBuckets.has('movie')) {
    jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/movie', discoverParams()).catch(() => ({ results: [] })));
  }
  if (allowedBuckets.has('animation')) {
    jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/movie', discoverParams({
      without_original_language: 'ja',
      without_keywords: '210024',
    })).catch(() => ({ results: [] })));
  }
  if (allowedBuckets.has('anime_movie')) {
    jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/movie', {
      with_genres: '16', with_original_language: 'ja', sort_by: 'vote_average.desc', 'vote_count.gte': '100', page,
    }).catch(() => ({ results: [] })));
  }
  if (allowedBuckets.has('tv')) {
    jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/tv', discoverParams({
      without_keywords: '210024', without_original_language: 'ja',
    })).catch(() => ({ results: [] })));
  }
  if (allowedBuckets.has('anime')) {
    jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/tv', {
      with_genres: '16', with_original_language: 'ja', sort_by: 'vote_average.desc', 'vote_count.gte': '100', page,
    }).catch(() => ({ results: [] })));
  }
  if (allowedBuckets.has('dorama')) {
    jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/discover/tv', {
      with_genres: '18', with_original_language: 'ko', sort_by: 'vote_average.desc', 'vote_count.gte': '100', page,
    }).catch(() => ({ results: [] })));
  }

  if (jobs.length === 0) {
    jobs.push(fetchFromTMDB<TmdbDiscoverResult>('/movie/popular', { page }).catch(() => ({ results: [] })));
  }

  const results = await Promise.all(jobs);
  const items: ColdStartItem[] = [];
  const seen = new Set<number>();

  for (const r of results) {
    for (const item of (r as any).results ?? []) {
      if (!seen.has(item.id) && !excludedIds.has(item.id)) {
        seen.add(item.id);
        items.push(tmdbItemToColdStart(item));
      }
    }
  }
  return items;
};

const fetchPopularFallback = async (seed: number, excludedIds: Set<number>): Promise<ColdStartItem[]> => {
  const page = String((seed % 10) + 1);
  const data = await fetchFromTMDB<TmdbDiscoverResult>('/movie/popular', { page }).catch(() => ({ results: [] }));
  return (data.results ?? []).filter(item => !excludedIds.has(item.id)).map(tmdbItemToColdStart);
};

export const getColdStartRecommendations = async (
  userId: number,
  seed = 0,
): Promise<ColdStartResponse> => {
  const watchedCount = await getWatchedCount(userId);
  const onboarding = await getOnboardingData(userId);
  const excludedIds = new Set<number>(onboarding?.watched_tmdb_ids ?? []);

  if (!onboarding) {
    const popular = await fetchPopularFallback(seed, excludedIds);
    return { recommendations: popular.slice(0, BATCH_SIZE), strategy: 'cold_start', watched_count: watchedCount };
  }

  // Якщо не відмітив фільмів але є актори
  if (onboarding.watched_tmdb_ids.length === 0) {
    const byActors = onboarding.liked_actor_ids.length > 0
      ? await fetchByActors(onboarding.liked_actor_ids, new Set<ContentBucket>(['movie']), [], seed, 5, excludedIds)
      : [];
    const popular = await fetchPopularFallback(seed, excludedIds);
    return { recommendations: buildBatch(byActors, [], popular, excludedIds), strategy: 'cold_start', watched_count: watchedCount };
  }

  const onboardingMovies = await getOnboardingMovies(onboarding.watched_tmdb_ids);
  const allowedBuckets = getAllowedBuckets(onboardingMovies);
  const genreWeights = computeGenreWeights(onboardingMovies, onboarding.ratings);
  const topGenreIds = getTopGenreIds(genreWeights, 3);
  const hasGoodRatings = Object.values(onboarding.ratings).some(r => r >= 7);
  const minVoteAvg = hasGoodRatings ? '6.5' : undefined;
  const actorIds = onboarding.liked_actor_ids;
  const slotsPerActor = actorIds.length > 0 ? Math.ceil(ACTOR_SLOTS / actorIds.length) : 0;

  const [actorResults, genreResults, popularResults] = await Promise.all([
    fetchByActors(actorIds, allowedBuckets, topGenreIds, seed, slotsPerActor, excludedIds, minVoteAvg),
    fetchByGenres(topGenreIds, allowedBuckets, seed, excludedIds, minVoteAvg),
    fetchPopularByBuckets(allowedBuckets, topGenreIds, seed, excludedIds),
  ]);

  console.log('[ColdStart] actorResults:', actorResults.length, 'genreResults:', genreResults.length, 'popularResults:', popularResults.length);

  const final = buildBatch(actorResults, genreResults, popularResults, excludedIds);

  console.log('[ColdStart] final:', final.length, final.map(f => f.title).join(', '));

  return { recommendations: final, strategy: 'cold_start', watched_count: watchedCount };
};