import {
  cosineSimilarity,
  cosineSimilarityFromCounts,
  jaccard,
} from './soulmate.math';

describe('cosineSimilarity', () => {

  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 6);
  });

  it('returns 1 for parallel vectors (same direction, different magnitude)', () => {
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
    expect(cosineSimilarity([1, 1], [1, 0])).toBeCloseTo(0.70710678, 6);
  });

  it('handles realistic rating vectors', () => {
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

describe('jaccard', () => {

  it('returns 1 for identical sets', () => {
    expect(jaccard(new Set([1, 2, 3]), new Set([1, 2, 3]))).toBe(1);
  });

  it('returns 0 for fully disjoint sets', () => {
    expect(jaccard(new Set([1, 2]), new Set([3, 4]))).toBe(0);
  });

  it('computes partial overlap correctly', () => {
    expect(jaccard(new Set([1, 2, 3]), new Set([2, 3, 4]))).toBe(0.5);
  });

  it('handles single shared element', () => {
    expect(jaccard(new Set([1, 2]), new Set([2, 3]))).toBeCloseTo(1 / 3, 6);
  });

  it('returns 0 for two empty sets', () => {
    expect(jaccard(new Set(), new Set())).toBe(0);
  });

  it('returns 0 when one set is empty', () => {
    expect(jaccard(new Set([1, 2, 3]), new Set())).toBe(0);
  });

  it('handles subset relationship', () => {
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