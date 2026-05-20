type ContentBucket = 'movie' | 'tv' | 'anime' | 'anime_movie' | 'dorama' | 'animation';

interface OnboardingMovie {
  tmdb_id: number;
  genre: string;
  media_type: 'movie' | 'tv';
}

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

const GENRE_TO_TMDB: Record<string, number[]> = {
  'Drama': [18], 'Thriller': [53], 'Action': [28], 'Comedy': [35],
  'Romance': [10749], 'Sci-Fi': [878], 'Horror': [27], 'Animation': [16],
  'Anime': [16], 'Fantasy': [14], 'Crime': [80], 'Adventure': [12],
  'Family': [10751], 'History': [36], 'Mystery': [9648], 'War': [10752],
  'K-Drama': [18], 'Series': [18],
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
  [...weights.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([id]) => id);

interface ColdStartItem {
  tmdb_id: number; media_type: 'movie' | 'tv'; title: string;
  poster_path: string | null; vote_average: number; overview: string; release_date: string;
}

const makeItem = (id: number, title: string): ColdStartItem => ({
  tmdb_id: id, media_type: 'movie', title,
  poster_path: null, vote_average: 7, overview: '', release_date: '2020-01-01',
});

const buildBatch = (
  byActors: ColdStartItem[], byGenres: ColdStartItem[],
  byPopular: ColdStartItem[], excludedIds: Set<number>,
  ACTOR_SLOTS = 10, GENRE_SLOTS = 10, POPULAR_SLOTS = 5, BATCH_SIZE = 25,
): ColdStartItem[] => {
  const seen = new Set<number>();
  const result: ColdStartItem[] = [];
  const addItems = (items: ColdStartItem[], limit: number) => {
    let added = 0;
    for (const item of items) {
      if (added >= limit) break;
      if (!seen.has(item.tmdb_id) && !excludedIds.has(item.tmdb_id)) {
        seen.add(item.tmdb_id); result.push(item); added++;
      }
    }
  };
  addItems(byActors, ACTOR_SLOTS);
  addItems(byGenres, GENRE_SLOTS);
  addItems(byPopular, POPULAR_SLOTS);
  if (result.length < BATCH_SIZE) {
    addItems([...byGenres, ...byActors, ...byPopular], BATCH_SIZE - result.length);
  }
  return result;
};


describe('getContentBucket', () => {

  describe('movie types', () => {
    it('regular movie -> movie', () => {
      expect(getContentBucket({ tmdb_id: 1, genre: 'Drama', media_type: 'movie' })).toBe('movie');
    });

    it('action movie -> movie', () => {
      expect(getContentBucket({ tmdb_id: 2, genre: 'Action', media_type: 'movie' })).toBe('movie');
    });

    it('animation movie -> animation (not anime!)', () => {
      expect(getContentBucket({ tmdb_id: 3, genre: 'Animation', media_type: 'movie' })).toBe('animation');
    });

    it('anime movie (Spirited Away) -> anime_movie', () => {
      expect(getContentBucket({ tmdb_id: 129, genre: 'Anime', media_type: 'movie' })).toBe('anime_movie');
    });

    it('Your Name (anime movie) -> anime_movie', () => {
      expect(getContentBucket({ tmdb_id: 372058, genre: 'Anime', media_type: 'movie' })).toBe('anime_movie');
    });
  });

  describe('tv types', () => {
    it('regular series -> tv', () => {
      expect(getContentBucket({ tmdb_id: 10, genre: 'Series', media_type: 'tv' })).toBe('tv');
    });

    it('Breaking Bad (Series) -> tv', () => {
      expect(getContentBucket({ tmdb_id: 1396, genre: 'Series', media_type: 'tv' })).toBe('tv');
    });

    it('anime series -> anime (not animation!)', () => {
      expect(getContentBucket({ tmdb_id: 20, genre: 'Anime', media_type: 'tv' })).toBe('anime');
    });

    it('K-Drama -> dorama', () => {
      expect(getContentBucket({ tmdb_id: 30, genre: 'K-Drama', media_type: 'tv' })).toBe('dorama');
    });

    it('Business Proposal (K-Drama) -> dorama', () => {
      expect(getContentBucket({ tmdb_id: 154825, genre: 'K-Drama', media_type: 'tv' })).toBe('dorama');
    });
  });

  describe('case insensitive', () => {
    it('lowercase anime -> anime_movie for movie', () => {
      expect(getContentBucket({ tmdb_id: 1, genre: 'anime', media_type: 'movie' })).toBe('anime_movie');
    });

    it('lowercase k-drama -> dorama', () => {
      expect(getContentBucket({ tmdb_id: 1, genre: 'k-drama', media_type: 'tv' })).toBe('dorama');
    });
  });
});

// getAllowedBuckets

describe('getAllowedBuckets', () => {

  it('only anime movies -> only anime_movie, NO movie', () => {
    const movies = [
      { tmdb_id: 129, genre: 'Anime', media_type: 'movie' as const },
      { tmdb_id: 372058, genre: 'Anime', media_type: 'movie' as const },
    ];
    const buckets = getAllowedBuckets(movies);
    expect(buckets.has('anime_movie')).toBe(true);
    expect(buckets.has('movie')).toBe(false);
    expect(buckets.has('animation')).toBe(false);
    expect(buckets.has('tv')).toBe(false);
  });

  it('only K-Drama -> only dorama, NO movie or tv', () => {
    const movies = [
      { tmdb_id: 154825, genre: 'K-Drama', media_type: 'tv' as const },
      { tmdb_id: 117378, genre: 'K-Drama', media_type: 'tv' as const },
    ];
    const buckets = getAllowedBuckets(movies);
    expect(buckets.has('dorama')).toBe(true);
    expect(buckets.has('movie')).toBe(false);
    expect(buckets.has('tv')).toBe(false);
  });

  it('only cartoons -> only animation, NO movie', () => {
    const movies = [
      { tmdb_id: 9806, genre: 'Animation', media_type: 'movie' as const },
      { tmdb_id: 585, genre: 'Animation', media_type: 'movie' as const },
    ];
    const buckets = getAllowedBuckets(movies);
    expect(buckets.has('animation')).toBe(true);
    expect(buckets.has('movie')).toBe(false);
    expect(buckets.has('anime_movie')).toBe(false);
  });

  it('only anime series -> only anime', () => {
    const movies = [{ tmdb_id: 1, genre: 'Anime', media_type: 'tv' as const }];
    const buckets = getAllowedBuckets(movies);
    expect(buckets.has('anime')).toBe(true);
    expect(buckets.has('anime_movie')).toBe(false);
    expect(buckets.has('movie')).toBe(false);
  });

  it('movies + series -> movie and tv', () => {
    const movies = [
      { tmdb_id: 238, genre: 'Drama', media_type: 'movie' as const },
      { tmdb_id: 1396, genre: 'Series', media_type: 'tv' as const },
    ];
    const buckets = getAllowedBuckets(movies);
    expect(buckets.has('movie')).toBe(true);
    expect(buckets.has('tv')).toBe(true);
    expect(buckets.size).toBe(2);
  });

  it('anime + regular movies -> anime_movie and movie', () => {
    const movies = [
      { tmdb_id: 129, genre: 'Anime', media_type: 'movie' as const },
      { tmdb_id: 238, genre: 'Drama', media_type: 'movie' as const },
    ];
    const buckets = getAllowedBuckets(movies);
    expect(buckets.has('anime_movie')).toBe(true);
    expect(buckets.has('movie')).toBe(true);
    expect(buckets.has('animation')).toBe(false);
  });

  it('empty list -> empty set', () => {
    const buckets = getAllowedBuckets([]);
    expect(buckets.size).toBe(0);
  });
});

// computeGenreWeights

describe('computeGenreWeights', () => {

  it('movie without rating -> weight 1', () => {
    const movies = [{ tmdb_id: 1, genre: 'Drama', media_type: 'movie' as const }];
    const weights = computeGenreWeights(movies, {});
    expect(weights.get(18)).toBe(1);
  });

  it('movie rated 8+ -> weight 3', () => {
    const movies = [{ tmdb_id: 1, genre: 'Drama', media_type: 'movie' as const }];
    const weights = computeGenreWeights(movies, { '1': 9 });
    expect(weights.get(18)).toBe(3);
  });

  it('movie rated 6-7 -> weight 2', () => {
    const movies = [{ tmdb_id: 1, genre: 'Action', media_type: 'movie' as const }];
    const weights = computeGenreWeights(movies, { '1': 7 });
    expect(weights.get(28)).toBe(2);
  });

  it('movie rated below 6 -> weight 1', () => {
    const movies = [{ tmdb_id: 1, genre: 'Horror', media_type: 'movie' as const }];
    const weights = computeGenreWeights(movies, { '1': 4 });
    expect(weights.get(27)).toBe(1);
  });

  it('two movies same genre -> weights sum up', () => {
    const movies = [
      { tmdb_id: 1, genre: 'Drama', media_type: 'movie' as const },
      { tmdb_id: 2, genre: 'Drama', media_type: 'movie' as const },
    ];
    const weights = computeGenreWeights(movies, { '1': 9, '2': 8 });
    expect(weights.get(18)).toBe(6); // 3 + 3
  });

  it('Drama dominates when all movies rated 9', () => {
    const movies = [
      { tmdb_id: 238, genre: 'Drama', media_type: 'movie' as const },
      { tmdb_id: 13, genre: 'Drama', media_type: 'movie' as const },
      { tmdb_id: 680, genre: 'Thriller', media_type: 'movie' as const },
    ];
    const weights = computeGenreWeights(movies, { '238': 9, '13': 9, '680': 6 });
    expect(weights.get(18)!).toBeGreaterThan(weights.get(53)!);
  });

  it('unknown genre -> ignored', () => {
    const movies = [{ tmdb_id: 1, genre: 'Bollywood', media_type: 'movie' as const }];
    const weights = computeGenreWeights(movies, {});
    expect(weights.size).toBe(0);
  });
});

// getTopGenreIds

describe('getTopGenreIds', () => {

  it('returns top N genres sorted by weight', () => {
    const weights = new Map([[18, 9], [28, 6], [53, 3], [35, 1]]);
    const top = getTopGenreIds(weights, 2);
    expect(top).toEqual([18, 28]);
  });

  it('returns all if fewer than N genres exist', () => {
    const weights = new Map([[18, 5], [28, 3]]);
    const top = getTopGenreIds(weights, 5);
    expect(top.length).toBe(2);
  });

  it('empty map -> empty array', () => {
    expect(getTopGenreIds(new Map(), 3)).toEqual([]);
  });

  it('Drama with highest weight is first', () => {
    const weights = new Map([[28, 2], [18, 10], [53, 5]]);
    const top = getTopGenreIds(weights, 3);
    expect(top[0]).toBe(18);
  });
});

// buildBatch

describe('buildBatch', () => {
  const makeItems = (count: number, startId = 0) =>
    Array.from({ length: count }, (_, i) => makeItem(startId + i, `Movie ${startId + i}`));

  it('returns exactly 25 when enough items available', () => {
    const result = buildBatch(
      makeItems(15, 0),
      makeItems(15, 100),
      makeItems(15, 200),
      new Set(),
    );
    expect(result.length).toBe(25);
  });

  it('first 10 items are from actors', () => {
    const actors = makeItems(10, 0);
    const genres = makeItems(10, 100);
    const popular = makeItems(5, 200);
    const result = buildBatch(actors, genres, popular, new Set());
    const actorIds = actors.map(a => a.tmdb_id);
    expect(result.slice(0, 10).every(r => actorIds.includes(r.tmdb_id))).toBe(true);
  });

  it('no duplicates in result', () => {
    const shared = makeItems(5, 0);
    const result = buildBatch(shared, shared, shared, new Set());
    const ids = result.map(r => r.tmdb_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('excludedIds do not appear in result', () => {
    const items = makeItems(20, 0);
    const excluded = new Set([0, 1, 2, 3, 4]);
    const result = buildBatch(items, [], [], excluded);
    expect(result.every(r => !excluded.has(r.tmdb_id))).toBe(true);
  });

  it('fills up to 25 from genres and popular when actors are few', () => {
    const actors = makeItems(3, 0);
    const genres = makeItems(20, 100);
    const popular = makeItems(10, 200);
    const result = buildBatch(actors, genres, popular, new Set());
    expect(result.length).toBe(25);
  });

  it('returns whatever is available without error when total is low', () => {
    const result = buildBatch(makeItems(3, 0), makeItems(4, 10), makeItems(2, 20), new Set());
    expect(result.length).toBe(9);
  });

  it('popular takes no more than 5 slots when batch is full', () => {
    const popular = makeItems(15, 200);
    const actors = makeItems(10, 0);
    const genres = makeItems(10, 100);
    const result = buildBatch(actors, genres, popular, new Set());
    const popularIds = new Set(popular.map(p => p.tmdb_id));
    const popularInResult = result.filter(r => popularIds.has(r.tmdb_id));
    expect(popularInResult.length).toBe(5);
  });
});

// integration scenarios (logic only, no network)

describe('Cold Start scenarios', () => {

  describe('User watched only anime movies', () => {
    const movies = [
      { tmdb_id: 129, genre: 'Anime', media_type: 'movie' as const },
      { tmdb_id: 372058, genre: 'Anime', media_type: 'movie' as const },
    ];

    it('allowedBuckets contains only anime_movie', () => {
      const buckets = getAllowedBuckets(movies);
      expect([...buckets]).toEqual(['anime_movie']);
    });

    it('does NOT contain movie, animation, tv, anime, dorama', () => {
      const buckets = getAllowedBuckets(movies);
      expect(buckets.has('movie')).toBe(false);
      expect(buckets.has('animation')).toBe(false);
      expect(buckets.has('tv')).toBe(false);
    });

    it('top genre is Animation (16)', () => {
      const weights = computeGenreWeights(movies, { '129': 9, '372058': 8 });
      const top = getTopGenreIds(weights, 3);
      expect(top).toContain(16);
    });
  });

  describe('User watched only K-Drama', () => {
    const movies = [
      { tmdb_id: 154825, genre: 'K-Drama', media_type: 'tv' as const },
      { tmdb_id: 117378, genre: 'K-Drama', media_type: 'tv' as const },
    ];

    it('allowedBuckets contains only dorama', () => {
      const buckets = getAllowedBuckets(movies);
      expect([...buckets]).toEqual(['dorama']);
    });

    it('does NOT contain movie, tv, anime', () => {
      const buckets = getAllowedBuckets(movies);
      expect(buckets.has('movie')).toBe(false);
      expect(buckets.has('tv')).toBe(false);
      expect(buckets.has('anime')).toBe(false);
    });
  });

  describe('User watched only cartoons', () => {
    const movies = [
      { tmdb_id: 9806, genre: 'Animation', media_type: 'movie' as const },
      { tmdb_id: 585, genre: 'Animation', media_type: 'movie' as const },
    ];

    it('allowedBuckets contains only animation', () => {
      const buckets = getAllowedBuckets(movies);
      expect([...buckets]).toEqual(['animation']);
    });

    it('does NOT contain movie or anime_movie', () => {
      const buckets = getAllowedBuckets(movies);
      expect(buckets.has('movie')).toBe(false);
      expect(buckets.has('anime_movie')).toBe(false);
    });
  });

  describe('User watched Drama movies', () => {
    const movies = [
      { tmdb_id: 238, genre: 'Drama', media_type: 'movie' as const },
      { tmdb_id: 13, genre: 'Drama', media_type: 'movie' as const },
      { tmdb_id: 857, genre: 'Drama', media_type: 'movie' as const },
    ];
    const ratings = { '238': 9, '13': 8, '857': 7 };

    it('allowedBuckets contains movie', () => {
      const buckets = getAllowedBuckets(movies);
      expect(buckets.has('movie')).toBe(true);
    });

    it('top genre is Drama (18)', () => {
      const weights = computeGenreWeights(movies, ratings);
      const top = getTopGenreIds(weights, 1);
      expect(top[0]).toBe(18);
    });

    it('Drama weight is higher than any other genre', () => {
      const weights = computeGenreWeights(movies, ratings);
      const dramaWeight = weights.get(18) ?? 0;
      for (const [id, w] of weights) {
        if (id !== 18) expect(dramaWeight).toBeGreaterThanOrEqual(w);
      }
    });
  });

  describe('User watched Drama + K-Drama mix', () => {
    const movies = [
      { tmdb_id: 238, genre: 'Drama',   media_type: 'movie' as const },
      { tmdb_id: 154825, genre: 'K-Drama', media_type: 'tv' as const },
    ];

    it('allowedBuckets contains both movie and dorama', () => {
      const buckets = getAllowedBuckets(movies);
      expect(buckets.has('movie')).toBe(true);
      expect(buckets.has('dorama')).toBe(true);
    });

    it('does NOT contain anime or animation', () => {
      const buckets = getAllowedBuckets(movies);
      expect(buckets.has('anime')).toBe(false);
      expect(buckets.has('animation')).toBe(false);
    });
  });

  describe('User marked nothing', () => {
    it('empty list -> empty buckets set', () => {
      expect(getAllowedBuckets([])).toEqual(new Set());
    });

    it('empty weights -> empty topGenreIds', () => {
      expect(getTopGenreIds(new Map(), 3)).toEqual([]);
    });
  });
});