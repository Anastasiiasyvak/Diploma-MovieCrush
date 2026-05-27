import {
  getContentBucket,
  getAllowedBucketsFiltered,
  computeGenreWeights,
  getLowRatedIds,
  getTopGenreIds,
  buildBatch,
  passesLanguageGenreFilter,
  type ColdStartItem,
  type OnboardingMovie,
  type ContentBucket,
} from '../modules/recommendations/cold_start_service';

const movie = (tmdb_id: number, genre: string): OnboardingMovie =>
  ({ tmdb_id, genre, media_type: 'movie' });

const series = (tmdb_id: number, genre: string): OnboardingMovie =>
  ({ tmdb_id, genre, media_type: 'tv' });

const makeItem = (id: number, title = `Movie ${id}`): ColdStartItem => ({
  tmdb_id: id,
  media_type: 'movie',
  title,
  poster_path: null,
  vote_average: 7,
  overview: '',
  release_date: '2020-01-01',
});

const makeItems = (count: number, startId = 0): ColdStartItem[] =>
  Array.from({ length: count }, (_, i) => makeItem(startId + i));

const tmdbResult = (overrides: { original_language?: string; genre_ids?: number[] } = {}) =>
  ({ id: 1, ...overrides }) as any;

// getContentBucket

describe('getContentBucket', () => {
  it('regular drama movie -> movie', () => {
    expect(getContentBucket(movie(1, 'Drama'))).toBe('movie');
  });

  it('cartoon (Animation) -> animation, NOT anime', () => {
    expect(getContentBucket(movie(3, 'Animation'))).toBe('animation');
  });

  it('anime movie -> anime_movie', () => {
    expect(getContentBucket(movie(129, 'Anime'))).toBe('anime_movie');
  });

  it('regular series -> tv', () => {
    expect(getContentBucket(series(10, 'Series'))).toBe('tv');
  });

  it('anime series -> anime, NOT animation', () => {
    expect(getContentBucket(series(20, 'Anime'))).toBe('anime');
  });

  it('K-Drama -> dorama', () => {
    expect(getContentBucket(series(30, 'K-Drama'))).toBe('dorama');
  });

  it('is case-insensitive', () => {
    expect(getContentBucket(movie(1, 'anime'))).toBe('anime_movie');
    expect(getContentBucket(series(1, 'k-drama'))).toBe('dorama');
  });
});

// computeGenreWeights (rating < 6 не враховується)

describe('computeGenreWeights', () => {
  it('movie without rating -> weight 1', () => {
    expect(computeGenreWeights([movie(1, 'Drama')], {}).get(18)).toBe(1);
  });

  it('movie rated 8+ -> weight 3', () => {
    expect(computeGenreWeights([movie(1, 'Drama')], { '1': 9 }).get(18)).toBe(3);
  });

  it('movie rated 6-7 -> weight 2', () => {
    expect(computeGenreWeights([movie(1, 'Action')], { '1': 7 }).get(28)).toBe(2);
  });

  it('movie rated below 6 -> genre NOT counted at all', () => {
    const weights = computeGenreWeights([movie(1, 'Horror')], { '1': 4 });
    expect(weights.has(27)).toBe(false);
    expect(weights.size).toBe(0);
  });

  it('mix: liked drama counts, disliked horror ignored', () => {
    const movies = [movie(1, 'Drama'), movie(2, 'Horror')];
    const weights = computeGenreWeights(movies, { '1': 9, '2': 2 });
    expect(weights.get(18)).toBe(3);
    expect(weights.has(27)).toBe(false);
  });

  it('two liked movies same genre -> weights sum', () => {
    const movies = [movie(1, 'Drama'), movie(2, 'Drama')];
    expect(computeGenreWeights(movies, { '1': 9, '2': 8 }).get(18)).toBe(6);
  });

  it('unknown genre -> ignored', () => {
    expect(computeGenreWeights([movie(1, 'Bollywood')], {}).size).toBe(0);
  });
});


describe('getAllowedBucketsFiltered', () => {
  it('only liked anime movies -> only anime_movie', () => {
    const movies = [movie(129, 'Anime'), movie(372058, 'Anime')];
    const buckets = getAllowedBucketsFiltered(movies, { '129': 9, '372058': 8 });
    expect([...buckets]).toEqual(['anime_movie']);
  });

  it('movies + series picked -> movie and tv only', () => {
    const movies = [movie(238, 'Drama'), series(1396, 'Series')];
    const buckets = getAllowedBucketsFiltered(movies, {});
    expect(buckets.has('movie')).toBe(true);
    expect(buckets.has('tv')).toBe(true);
    expect(buckets.has('anime')).toBe(false);
    expect(buckets.has('dorama')).toBe(false);
    expect(buckets.size).toBe(2);
  });

  it('disliked anime (rating 1) does NOT open anime bucket', () => {
    const movies = [movie(238, 'Drama'), movie(129, 'Anime')];
    const buckets = getAllowedBucketsFiltered(movies, { '238': 9, '129': 1 });
    expect(buckets.has('movie')).toBe(true);
    expect(buckets.has('anime_movie')).toBe(false);
  });

  it('disliked dorama does NOT open dorama bucket', () => {
    const movies = [series(1396, 'Series'), series(154825, 'K-Drama')];
    const buckets = getAllowedBucketsFiltered(movies, { '1396': 8, '154825': 3 });
    expect(buckets.has('tv')).toBe(true);
    expect(buckets.has('dorama')).toBe(false);
  });

  it('unrated items still count (neutral)', () => {
    const buckets = getAllowedBucketsFiltered([movie(1, 'Drama')], {});
    expect(buckets.has('movie')).toBe(true);
  });

  it('empty list -> empty set', () => {
    expect(getAllowedBucketsFiltered([], {}).size).toBe(0);
  });
});

describe('getLowRatedIds', () => {
  it('returns ids of titles rated below 6', () => {
    const movies = [movie(1, 'Drama'), movie(2, 'Horror'), movie(3, 'Action')];
    const ids = getLowRatedIds(movies, { '1': 9, '2': 3, '3': 5 });
    expect(ids.sort()).toEqual([2, 3]);
  });

  it('unrated titles are NOT low-rated', () => {
    expect(getLowRatedIds([movie(1, 'Drama')], {})).toEqual([]);
  });

  it('rating exactly 6 is NOT low-rated', () => {
    expect(getLowRatedIds([movie(1, 'Drama')], { '1': 6 })).toEqual([]);
  });

  it('empty list -> empty array', () => {
    expect(getLowRatedIds([], {})).toEqual([]);
  });
});

// getTopGenreIds

describe('getTopGenreIds', () => {
  it('returns top N sorted by weight', () => {
    const weights = new Map([[18, 9], [28, 6], [53, 3], [35, 1]]);
    expect(getTopGenreIds(weights, 2)).toEqual([18, 28]);
  });

  it('returns all when fewer than N', () => {
    expect(getTopGenreIds(new Map([[18, 5], [28, 3]]), 5).length).toBe(2);
  });

  it('empty map -> empty array', () => {
    expect(getTopGenreIds(new Map(), 3)).toEqual([]);
  });
});

// passesLanguageGenreFilter

describe('passesLanguageGenreFilter', () => {
  const movieTv: Set<ContentBucket> = new Set(['movie', 'tv']);

  it('western movie passes for movie+tv', () => {
    expect(passesLanguageGenreFilter(tmdbResult({ original_language: 'en', genre_ids: [28] }), movieTv)).toBe(true);
  });

  it('korean drama BLOCKED when dorama not picked', () => {
    expect(passesLanguageGenreFilter(tmdbResult({ original_language: 'ko', genre_ids: [18] }), movieTv)).toBe(false);
  });

  it('japanese anime BLOCKED when anime not picked', () => {
    expect(passesLanguageGenreFilter(tmdbResult({ original_language: 'ja', genre_ids: [16] }), movieTv)).toBe(false);
  });

  it('cartoon (genre 16) BLOCKED when animation not picked', () => {
    expect(passesLanguageGenreFilter(tmdbResult({ original_language: 'en', genre_ids: [16] }), movieTv)).toBe(false);
  });

  it('korean drama ALLOWED when dorama picked', () => {
    const buckets: Set<ContentBucket> = new Set(['tv', 'dorama']);
    expect(passesLanguageGenreFilter(tmdbResult({ original_language: 'ko', genre_ids: [18] }), buckets)).toBe(true);
  });

  it('anime ALLOWED when anime picked', () => {
    const buckets: Set<ContentBucket> = new Set(['anime']);
    expect(passesLanguageGenreFilter(tmdbResult({ original_language: 'ja', genre_ids: [16] }), buckets)).toBe(true);
  });

  it('cartoon ALLOWED when animation picked', () => {
    const buckets: Set<ContentBucket> = new Set(['animation']);
    expect(passesLanguageGenreFilter(tmdbResult({ original_language: 'en', genre_ids: [16] }), buckets)).toBe(true);
  });

  it('anime picked also allows cartoons (animation implied)', () => {
    const buckets: Set<ContentBucket> = new Set(['anime']);
    expect(passesLanguageGenreFilter(tmdbResult({ original_language: 'en', genre_ids: [16] }), buckets)).toBe(true);
  });

  it('missing fields default to passing (non-animation, no lang)', () => {
    expect(passesLanguageGenreFilter(tmdbResult({}), movieTv)).toBe(true);
  });
});

// buildBatch

describe('buildBatch', () => {
  it('returns exactly 25 when enough items', () => {
    const result = buildBatch(makeItems(15, 0), makeItems(15, 100), makeItems(15, 200), new Set());
    expect(result.length).toBe(25);
  });

  it('actors come first', () => {
    const actors = makeItems(10, 0);
    const result = buildBatch(actors, makeItems(10, 100), makeItems(5, 200), new Set());
    const actorIds = new Set(actors.map(a => a.tmdb_id));
    expect(result.slice(0, 10).every(r => actorIds.has(r.tmdb_id))).toBe(true);
  });

  it('actors are capped so genres still appear (many actors)', () => {
    const actors = makeItems(20, 0);
    const genres = makeItems(20, 100);
    const result = buildBatch(actors, genres, [], new Set());
    const genreIds = new Set(genres.map(g => g.tmdb_id));
    const genresInResult = result.filter(r => genreIds.has(r.tmdb_id));
    expect(genresInResult.length).toBeGreaterThan(0);
    expect(result.length).toBe(25);
  });

  it('few actors -> genres fill the rest', () => {
    const result = buildBatch(makeItems(3, 0), makeItems(20, 100), makeItems(10, 200), new Set());
    expect(result.length).toBe(25);
  });

  it('no duplicates', () => {
    const shared = makeItems(5, 0);
    const result = buildBatch(shared, shared, shared, new Set());
    expect(new Set(result.map(r => r.tmdb_id)).size).toBe(result.length);
  });

  it('excludedIds never appear', () => {
    const excluded = new Set([0, 1, 2, 3, 4]);
    const result = buildBatch(makeItems(20, 0), [], [], excluded);
    expect(result.every(r => !excluded.has(r.tmdb_id))).toBe(true);
  });

  it('returns whatever is available when total is low', () => {
    const result = buildBatch(makeItems(3, 0), makeItems(4, 10), makeItems(2, 20), new Set());
    expect(result.length).toBe(9);
  });
});

describe('Onboarding taste scenarios', () => {
  it('only anime movies -> anime_movie bucket + genre 16', () => {
    const movies = [movie(129, 'Anime'), movie(372058, 'Anime')];
    const ratings = { '129': 9, '372058': 8 };
    expect([...getAllowedBucketsFiltered(movies, ratings)]).toEqual(['anime_movie']);
    expect(getTopGenreIds(computeGenreWeights(movies, ratings), 3)).toContain(16);
  });

  it('series picked but NOT dorama -> tv only, no dorama', () => {
    const movies = [series(1396, 'Series'), series(66732, 'Series')];
    const buckets = getAllowedBucketsFiltered(movies, { '1396': 9, '66732': 8 });
    expect(buckets.has('tv')).toBe(true);
    expect(buckets.has('dorama')).toBe(false);
    expect(buckets.has('anime')).toBe(false);
  });

  it('movies + series mix, one disliked anime -> no anime leak', () => {
    const movies = [movie(238, 'Drama'), series(1396, 'Series'), movie(129, 'Anime')];
    const ratings = { '238': 9, '1396': 8, '129': 2 };
    const buckets = getAllowedBucketsFiltered(movies, ratings);
    expect(buckets.has('movie')).toBe(true);
    expect(buckets.has('tv')).toBe(true);
    expect(buckets.has('anime_movie')).toBe(false);
    expect(getLowRatedIds(movies, ratings)).toEqual([129]);
  });

  it('user marked nothing -> empty buckets and genres', () => {
    expect(getAllowedBucketsFiltered([], {}).size).toBe(0);
    expect(getTopGenreIds(new Map(), 3)).toEqual([]);
  });
});