import {
  cosineSimilarity,
  cosineSimilarityFromCounts,
  jaccard,
  weightedSum,
  isRecomputeThrottled,
  buildRatingVectors,
  WEIGHTS,
  RECOMPUTE_COOLDOWN_MS,
} from '../modules/soulmate/soulmate.math';

// cosineSimilarity

describe('cosineSimilarity', () => {

  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
  });

  it('returns 1 for parallel vectors (same direction, different magnitude)', () => {
    // [2,4,6] = 2 * [1,2,3] — same direction, cosine = 1
    expect(cosineSimilarity([1, 2, 3], [2, 4, 6])).toBeCloseTo(1, 6);
  });

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 6);
  });

  it('returns 0 when one vector is all zeros (avoids division by zero)', () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it('returns 0 for two empty vectors', () => {
    expect(cosineSimilarity([], [])).toBe(0);
  });

  it('computes a known intermediate value correctly', () => {
    // A=[1,1], B=[1,0]: dot=1, |A|=√2, |B|=1 => 1/√2 ≈ 0.7071
    expect(cosineSimilarity([1, 1], [1, 0])).toBeCloseTo(0.70710678, 6);
  });

  it('handles realistic rating vectors', () => {
    // Two users who rate similarly but not identically
    const userA = [5, 4, 5, 3, 4];
    const userB = [4, 4, 5, 3, 5];
    const sim = cosineSimilarity(userA, userB);
    expect(sim).toBeGreaterThan(0.9);
    expect(sim).toBeLessThanOrEqual(1);
  });

  it('throws when vectors have different lengths', () => {
    expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('Vectors must have the same length');
  });

  it('result is symmetric: cos(A,B) === cos(B,A)', () => {
    const a = [3, 1, 4, 1, 5];
    const b = [2, 7, 1, 8, 2];
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
  });
});

// cosineSimilarityFromCounts (mood vectors)

describe('cosineSimilarityFromCounts', () => {

  it('returns 1 for identical count maps', () => {
    const a = { happy: 3, sad: 1, tense: 2 };
    const b = { happy: 3, sad: 1, tense: 2 };
    expect(cosineSimilarityFromCounts(a, b)).toBeCloseTo(1, 6);
  });

  it('returns 1 for proportional count maps', () => {
    const a = { happy: 2, sad: 4 };
    const b = { happy: 1, sad: 2 };
    expect(cosineSimilarityFromCounts(a, b)).toBeCloseTo(1, 6);
  });

  it('handles disjoint keys (no shared moods) as 0', () => {
    const a = { happy: 5 };
    const b = { sad: 5 };
    expect(cosineSimilarityFromCounts(a, b)).toBeCloseTo(0, 6);
  });

  it('handles partially overlapping keys', () => {
    // a={happy:1, sad:1}, b={happy:1}: union space {happy,sad}
    // A=[1,1], B=[1,0] => 1/√2 ≈ 0.7071
    const a = { happy: 1, sad: 1 };
    const b = { happy: 1 };
    expect(cosineSimilarityFromCounts(a, b)).toBeCloseTo(0.70710678, 6);
  });

  it('returns 0 for two empty maps', () => {
    expect(cosineSimilarityFromCounts({}, {})).toBe(0);
  });

  it('returns 0 when one map is empty', () => {
    expect(cosineSimilarityFromCounts({ happy: 3 }, {})).toBe(0);
  });
});

// jaccard

describe('jaccard', () => {

  it('returns 1 for identical sets', () => {
    expect(jaccard(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(1);
  });

  it('returns 0 for fully disjoint sets', () => {
    expect(jaccard(new Set([1, 2]), new Set([3, 4]))).toBe(0);
  });

  it('computes partial overlap correctly', () => {
    // {1,2,3} ∩ {2,3,4} = {2,3} (size 2); union = {1,2,3,4} (size 4) => 0.5
    expect(jaccard(new Set([1, 2, 3]), new Set([2, 3, 4]))).toBe(0.5);
  });

  it('handles single shared element', () => {
    // {1,2} ∩ {2,3} = {2} (1); union {1,2,3} (3) => 1/3
    expect(jaccard(new Set([1, 2]), new Set([2, 3]))).toBeCloseTo(1 / 3, 6);
  });

  it('returns 0 for two empty sets', () => {
    expect(jaccard(new Set(), new Set())).toBe(0);
  });

  it('returns 0 when one set is empty', () => {
    expect(jaccard(new Set([1, 2, 3]), new Set())).toBe(0);
  });

  it('handles subset relationship', () => {
    // {1,2} ⊂ {1,2,3,4}: intersection 2, union 4 => 0.5
    expect(jaccard(new Set([1, 2]), new Set([1, 2, 3, 4]))).toBe(0.5);
  });

  it('is symmetric: J(A,B) === J(B,A)', () => {
    const a = new Set([1, 2, 3, 5]);
    const b = new Set([2, 3, 4]);
    expect(jaccard(a, b)).toBe(jaccard(b, a));
  });

  it('works with string sets', () => {
    expect(jaccard(new Set(['a', 'b']), new Set(['b', 'c']))).toBeCloseTo(1 / 3, 6);
  });
});

// weightedSum

describe('weightedSum', () => {

  it('weights sum to exactly 1.0 (sanity check on constants)', () => {
    const total = WEIGHTS.rating + WEIGHTS.genre + WEIGHTS.actor +
                  WEIGHTS.mood + WEIGHTS.disliked;
    expect(total).toBeCloseTo(1.0, 10);
  });

  it('returns 1 when all metrics are 1 (because weights sum to 1)', () => {
    expect(weightedSum({
      rating: 1, genre: 1, actor: 1, mood: 1, disliked: 1,
    })).toBeCloseTo(1, 10);
  });

  it('returns 0 when all metrics are 0', () => {
    expect(weightedSum({
      rating: 0, genre: 0, actor: 0, mood: 0, disliked: 0,
    })).toBe(0);
  });

  it('returns exactly the rating weight when only rating is 1', () => {
    expect(weightedSum({
      rating: 1, genre: 0, actor: 0, mood: 0, disliked: 0,
    })).toBeCloseTo(WEIGHTS.rating, 10);
  });

  it('returns exactly the disliked weight when only disliked is 1', () => {
    expect(weightedSum({
      rating: 0, genre: 0, actor: 0, mood: 0, disliked: 1,
    })).toBeCloseTo(WEIGHTS.disliked, 10);
  });

  it('computes a realistic mixed score correctly', () => {
    // rating .9*.45 + genre .5*.22 + actor .3*.16 + mood .6*.11 + disliked .1*.06
    // = .405 + .11 + .048 + .066 + .006 = .635
    const score = weightedSum({
      rating: 0.9, genre: 0.5, actor: 0.3, mood: 0.6, disliked: 0.1,
    });
    expect(score).toBeCloseTo(0.635, 6);
  });

  it('rating contributes more than disliked for the same metric value', () => {
    const onlyRating = weightedSum({ rating: 0.5, genre: 0, actor: 0, mood: 0, disliked: 0 });
    const onlyDisliked = weightedSum({ rating: 0, genre: 0, actor: 0, mood: 0, disliked: 0.5 });
    expect(onlyRating).toBeGreaterThan(onlyDisliked);
  });

  it('result stays within [0, 1] for any valid inputs', () => {
    const score = weightedSum({
      rating: 0.7, genre: 0.8, actor: 0.6, mood: 0.9, disliked: 0.3,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

// isRecomputeThrottled

describe('isRecomputeThrottled', () => {

  it('returns false when never computed before (null)', () => {
    expect(isRecomputeThrottled(null)).toBe(false);
  });

  it('returns true when computed just now', () => {
    const now = new Date('2025-06-01T12:00:00Z');
    const lastComputed = new Date('2025-06-01T12:00:00Z');
    expect(isRecomputeThrottled(lastComputed, now)).toBe(true);
  });

  it('returns true when computed 1 hour ago', () => {
    const now = new Date('2025-06-01T12:00:00Z');
    const lastComputed = new Date('2025-06-01T11:00:00Z');
    expect(isRecomputeThrottled(lastComputed, now)).toBe(true);
  });

  it('returns true when computed 23h59m ago (just under cooldown)', () => {
    const now = new Date('2025-06-02T12:00:00Z');
    const lastComputed = new Date('2025-06-01T12:01:00Z');
    expect(isRecomputeThrottled(lastComputed, now)).toBe(true);
  });

  it('returns false when computed exactly 24h ago (boundary)', () => {
    const now = new Date('2025-06-02T12:00:00Z');
    const lastComputed = new Date('2025-06-01T12:00:00Z');
    // elapsed === cooldown, and throttle is `elapsed < cooldown`, so not throttled
    expect(isRecomputeThrottled(lastComputed, now)).toBe(false);
  });

  it('returns false when computed 25 hours ago', () => {
    const now = new Date('2025-06-02T13:00:00Z');
    const lastComputed = new Date('2025-06-01T12:00:00Z');
    expect(isRecomputeThrottled(lastComputed, now)).toBe(false);
  });

  it('returns false when computed several days ago', () => {
    const now = new Date('2025-06-10T12:00:00Z');
    const lastComputed = new Date('2025-06-01T12:00:00Z');
    expect(isRecomputeThrottled(lastComputed, now)).toBe(false);
  });

  it('cooldown constant equals 24 hours', () => {
    expect(RECOMPUTE_COOLDOWN_MS).toBe(24 * 60 * 60 * 1000);
  });
});

// buildRatingVectors

describe('buildRatingVectors', () => {

  it('builds parallel vectors from rows', () => {
    const rows = [
      { tmdb_id: 100, rating_a: 5, rating_b: 4 },
      { tmdb_id: 200, rating_a: 3, rating_b: 3 },
    ];
    const { vectorA, vectorB, sharedMovies } = buildRatingVectors(rows);
    expect(vectorA).toEqual([5, 3]);
    expect(vectorB).toEqual([4, 3]);
    expect(sharedMovies).toEqual([100, 200]);
  });

  it('coerces string values to numbers (Postgres returns strings)', () => {
    const rows = [
      { tmdb_id: '100', rating_a: '5', rating_b: '4' },
    ];
    const { vectorA, vectorB, sharedMovies } = buildRatingVectors(rows);
    expect(vectorA).toEqual([5]);
    expect(vectorB).toEqual([4]);
    expect(sharedMovies).toEqual([100]);
  });

  it('returns empty arrays for empty input', () => {
    const { vectorA, vectorB, sharedMovies } = buildRatingVectors([]);
    expect(vectorA).toEqual([]);
    expect(vectorB).toEqual([]);
    expect(sharedMovies).toEqual([]);
  });

  it('preserves order and count of rows', () => {
    const rows = [
      { tmdb_id: 1, rating_a: 5, rating_b: 5 },
      { tmdb_id: 2, rating_a: 4, rating_b: 4 },
      { tmdb_id: 3, rating_a: 3, rating_b: 3 },
    ];
    const { vectorA, sharedMovies } = buildRatingVectors(rows);
    expect(vectorA).toHaveLength(3);
    expect(sharedMovies).toEqual([1, 2, 3]);
  });

  it('output integrates with cosineSimilarity', () => {
    const rows = [
      { tmdb_id: 1, rating_a: 5, rating_b: 5 },
      { tmdb_id: 2, rating_a: 4, rating_b: 4 },
    ];
    const { vectorA, vectorB } = buildRatingVectors(rows);
    expect(cosineSimilarity(vectorA, vectorB)).toBeCloseTo(1, 6);
  });
});