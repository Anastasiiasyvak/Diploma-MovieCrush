export const RECOMPUTE_COOLDOWN_MS = 24 * 60 * 60 * 1000;


export const WEIGHTS = {
  rating: 0.45,
  genre: 0.22,
  actor: 0.16,
  mood: 0.11,
  disliked: 0.06,
} as const;


export const MIN_RATING_OVERLAP = 3;

export const MIN_USER_MOVIES = 5;

// Поріг загальної схожості, нижче якого метчу немає
export const MIN_SCORE_THRESHOLD = 0.30;


// Cosine similarity для двох числових векторів однакової довжини
export const cosineSimilarity = (vectorA: number[], vectorB: number[]): number => {
  if (vectorA.length !== vectorB.length) {
    throw new Error('Vectors must have the same length');
  }
  if (vectorA.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
};


// Jaccard similarity для двох множин
export const jaccard = <T>(setA: Set<T>, setB: Set<T>): number => {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
};


// cosine similarity для двох "bag of counts", Приймає 2 мапи (ключ і кількість) і рахує cosine по об'єднаному простору ключів
export const cosineSimilarityFromCounts = (
  countsA: Record<string, number>,
  countsB: Record<string, number>
): number => {
  const allKeys = new Set([...Object.keys(countsA), ...Object.keys(countsB)]);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key of allKeys) {
    const a = countsA[key] ?? 0;
    const b = countsB[key] ?? 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
};


export interface SimilarityScores {
  rating: number;
  genre: number;
  actor: number;
  mood: number;
  disliked: number;
}


// Зважена сума 5 метрик схожості за константами WEIGHTS
export const weightedSum = (scores: SimilarityScores): number => {
  return (
    WEIGHTS.rating * scores.rating +
    WEIGHTS.genre * scores.genre +
    WEIGHTS.actor * scores.actor +
    WEIGHTS.mood * scores.mood +
    WEIGHTS.disliked * scores.disliked
  );
};


// перевіряє через кулдоун чи можна зробить recompute
export const isRecomputeThrottled = (
  lastComputedAt: Date | null,
  now: Date = new Date()
): boolean => {
  if (lastComputedAt === null) return false;
  const elapsed = now.getTime() - lastComputedAt.getTime();
  return elapsed < RECOMPUTE_COOLDOWN_MS;
};


// Будує 2 паралельних вектори рейтингів зі списку спільно оцінених фільмів
export const buildRatingVectors = (
  rows: Array<{ tmdb_id: number | string; rating_a: number | string; rating_b: number | string }>
): { vectorA: number[]; vectorB: number[]; sharedMovies: number[] } => {
  const vectorA: number[] = [];
  const vectorB: number[] = [];
  const sharedMovies: number[] = [];

  for (const row of rows) {
    vectorA.push(Number(row.rating_a));
    vectorB.push(Number(row.rating_b));
    sharedMovies.push(Number(row.tmdb_id));
  }

  return { vectorA, vectorB, sharedMovies };
};