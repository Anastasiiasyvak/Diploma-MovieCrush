import pool from '../../config/database';
import { SimilarityBreakdown } from './soulmate.types';

const WEIGHTS = {
  rating: 0.40,
  genre: 0.20,
  actor: 0.15,
  mood: 0.10,
  director: 0.10,
  disliked: 0.05,
} as const;

const MIN_RATING_OVERLAP = 3;
const MIN_USER_MOVIES = 5;
const MIN_SCORE_THRESHOLD = 0.30;

const computeRatingCosineSimilarity = async (
  userA: number, userB: number
): Promise<{ similarity: number; sharedMovies: number[] }> => {
  const result = await pool.query(
    `SELECT
       ra.tmdb_id,
       ra.overall_rating AS rating_a,
       rb.overall_rating AS rating_b
     FROM user_detailed_ratings ra
     JOIN user_detailed_ratings rb ON ra.tmdb_id = rb.tmdb_id
     WHERE ra.user_id = $1
       AND rb.user_id = $2
       AND ra.overall_rating IS NOT NULL
       AND rb.overall_rating IS NOT NULL`,
    [userA, userB]
  );

  if (result.rows.length < MIN_RATING_OVERLAP) {
    return { similarity: 0, sharedMovies: [] };
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  const sharedMovies: number[] = [];

  for (const row of result.rows) {
    const rA = Number(row.rating_a);
    const rB = Number(row.rating_b);
    dotProduct += rA * rB;
    normA += rA * rA;
    normB += rB * rB;
    sharedMovies.push(Number(row.tmdb_id));
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  const similarity = denom === 0 ? 0 : dotProduct / denom;
  return { similarity, sharedMovies };
};

const jaccard = <T>(setA: Set<T>, setB: Set<T>): number => {
  if (setA.size === 0 && setB.size === 0) return 0;
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

const computeWatchedOverlap = async (
  userA: number, userB: number
): Promise<number> => {
  const result = await pool.query(
    `WITH a_watched AS (
       SELECT li.tmdb_id FROM list_items li
       JOIN user_lists ul ON ul.id = li.list_id
       WHERE ul.user_id = $1 AND ul.list_type = 'watched'
     ),
     b_watched AS (
       SELECT li.tmdb_id FROM list_items li
       JOIN user_lists ul ON ul.id = li.list_id
       WHERE ul.user_id = $2 AND ul.list_type = 'watched'
     )
     SELECT
       (SELECT COUNT(*) FROM a_watched a WHERE a.tmdb_id IN (SELECT tmdb_id FROM b_watched))::int AS intersect_count,
       (SELECT COUNT(*) FROM a_watched)::int AS a_count,
       (SELECT COUNT(*) FROM b_watched)::int AS b_count`,
    [userA, userB]
  );
  const row = result.rows[0];
  const inter = Number(row.intersect_count) || 0;
  const aCount = Number(row.a_count) || 0;
  const bCount = Number(row.b_count) || 0;
  const union = aCount + bCount - inter;
  return union === 0 ? 0 : inter / union;
};

const computeActorOverlap = async (
  userA: number, userB: number
): Promise<number> => {
  const [resA, resB] = await Promise.all([
    pool.query(
      `SELECT DISTINCT actor_tmdb_id FROM user_best_actor_votes WHERE user_id = $1`,
      [userA]
    ),
    pool.query(
      `SELECT DISTINCT actor_tmdb_id FROM user_best_actor_votes WHERE user_id = $1`,
      [userB]
    ),
  ]);
  const setA = new Set(resA.rows.map(r => Number(r.actor_tmdb_id)));
  const setB = new Set(resB.rows.map(r => Number(r.actor_tmdb_id)));
  return jaccard(setA, setB);
};

const computeMoodSimilarity = async (
  userA: number, userB: number
): Promise<number> => {
  const result = await pool.query(
    `SELECT user_id, mood, COUNT(*)::int AS cnt
     FROM user_movie_moods
     WHERE user_id IN ($1, $2)
     GROUP BY user_id, mood`,
    [userA, userB]
  );

  if (result.rows.length === 0) return 0;

  const moodsA: Record<string, number> = {};
  const moodsB: Record<string, number> = {};
  for (const row of result.rows) {
    if (Number(row.user_id) === userA) moodsA[row.mood] = Number(row.cnt);
    else                                moodsB[row.mood] = Number(row.cnt);
  }

  const allMoods = new Set([...Object.keys(moodsA), ...Object.keys(moodsB)]);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (const m of allMoods) {
    const a = moodsA[m] ?? 0;
    const b = moodsB[m] ?? 0;
    dotProduct += a * b;
    normA += a * a;
    normB += b * b;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
};

const computeDirectorOverlap = async (
  userA: number, userB: number
): Promise<number> => {
  const [resA, resB] = await Promise.all([
    pool.query(
      `SELECT DISTINCT top_director_tmdb_id FROM user_yearly_stats
       WHERE user_id = $1 AND top_director_tmdb_id IS NOT NULL`,
      [userA]
    ),
    pool.query(
      `SELECT DISTINCT top_director_tmdb_id FROM user_yearly_stats
       WHERE user_id = $1 AND top_director_tmdb_id IS NOT NULL`,
      [userB]
    ),
  ]);
  const setA = new Set(resA.rows.map(r => Number(r.top_director_tmdb_id)));
  const setB = new Set(resB.rows.map(r => Number(r.top_director_tmdb_id)));
  return jaccard(setA, setB);
};

const computeDislikedOverlap = async (
  userA: number, userB: number
): Promise<{ similarity: number; sharedDisliked: number[] }> => {
  const [resA, resB, both] = await Promise.all([
    pool.query(
      `SELECT tmdb_id FROM user_movie_actions WHERE user_id = $1 AND is_disliked = TRUE`,
      [userA]
    ),
    pool.query(
      `SELECT tmdb_id FROM user_movie_actions WHERE user_id = $1 AND is_disliked = TRUE`,
      [userB]
    ),
    pool.query(
      `SELECT a.tmdb_id
       FROM user_movie_actions a
       JOIN user_movie_actions b ON a.tmdb_id = b.tmdb_id
       WHERE a.user_id = $1 AND a.is_disliked = TRUE
         AND b.user_id = $2 AND b.is_disliked = TRUE`,
      [userA, userB]
    ),
  ]);
  const setA = new Set(resA.rows.map(r => Number(r.tmdb_id)));
  const setB = new Set(resB.rows.map(r => Number(r.tmdb_id)));
  const sim = jaccard(setA, setB);
  const sharedDisliked = both.rows.map(r => Number(r.tmdb_id));
  return { similarity: sim, sharedDisliked };
};

export const computeHybridSimilarity = async (
  userA: number, userB: number
): Promise<SimilarityBreakdown & { sharedMovies: number[]; sharedDisliked: number[] }> => {
  const [
    rating,
    genre,
    actor,
    mood,
    director,
    disliked,
  ] = await Promise.all([
    computeRatingCosineSimilarity(userA, userB),
    computeWatchedOverlap(userA, userB),
    computeActorOverlap(userA, userB),
    computeMoodSimilarity(userA, userB),
    computeDirectorOverlap(userA, userB),
    computeDislikedOverlap(userA, userB),
  ]);

  const total =
    WEIGHTS.rating * rating.similarity +
    WEIGHTS.genre * genre +
    WEIGHTS.actor * actor +
    WEIGHTS.mood * mood +
    WEIGHTS.director * director +
    WEIGHTS.disliked * disliked.similarity;

  return {
    total,
    rating_similarity: rating.similarity,
    genre_similarity: genre,
    actor_similarity: actor,
    mood_similarity: mood,
    director_similarity: director,
    disliked_similarity: disliked.similarity,
    sharedMovies: rating.sharedMovies,
    sharedDisliked: disliked.sharedDisliked,
  };
};

const getEligibleCandidates = async (userId: number): Promise<number[]> => {
  const result = await pool.query(
    `SELECT id FROM users
     WHERE soulmate_consent = TRUE
       AND account_status = 'active'
       AND movies_watched >= $2
       AND id <> $1`,
    [userId, MIN_USER_MOVIES]
  );
  return result.rows.map(r => Number(r.id));
};

export const computeSoulmateForUser = async (
  userId: number,
  wrappedYear: number = new Date().getFullYear()
): Promise<{ matched_user_id: number; similarity_score: number } | null> => {
  const meCheck = await pool.query(
    `SELECT soulmate_consent FROM users WHERE id = $1`,
    [userId]
  );
  if (meCheck.rows.length === 0) throw new Error('User not found');
  if (!meCheck.rows[0].soulmate_consent) throw new Error('User did not consent to soulmate matching');

  const candidates = await getEligibleCandidates(userId);
  if (candidates.length === 0) return null;

  let bestCandidate: number | null = null;
  let bestScore = -1;
  let bestBreakdown: any = null;

  for (const candidateId of candidates) {
    const breakdown = await computeHybridSimilarity(userId, candidateId);
    if (breakdown.total > bestScore) {
      bestScore = breakdown.total;
      bestCandidate = candidateId;
      bestBreakdown = breakdown;
    }
  }

  if (bestCandidate === null || bestScore < MIN_SCORE_THRESHOLD) {
    return null;
  }

  const topShared = (bestBreakdown.sharedMovies as number[]).slice(0, 5);
  const sharedDisliked = (bestBreakdown.sharedDisliked as number[]).slice(0, 5);

  await pool.query(
    `INSERT INTO user_soulmate_matches (
       user_id, matched_user_id, wrapped_year,
       similarity_score,
       rating_similarity, genre_similarity, actor_similarity,
       mood_similarity, director_similarity, disliked_similarity,
       shared_movies_count, top_shared_movies, shared_disliked
     ) VALUES (
       $1, $2, $3,
       $4,
       $5, $6, $7,
       $8, $9, $10,
       $11, $12, $13
     )
     ON CONFLICT (user_id, wrapped_year) DO UPDATE SET
       matched_user_id = EXCLUDED.matched_user_id,
       similarity_score = EXCLUDED.similarity_score,
       rating_similarity = EXCLUDED.rating_similarity,
       genre_similarity = EXCLUDED.genre_similarity,
       actor_similarity = EXCLUDED.actor_similarity,
       mood_similarity = EXCLUDED.mood_similarity,
       director_similarity = EXCLUDED.director_similarity,
       disliked_similarity = EXCLUDED.disliked_similarity,
       shared_movies_count = EXCLUDED.shared_movies_count,
       top_shared_movies = EXCLUDED.top_shared_movies,
       shared_disliked = EXCLUDED.shared_disliked,
       computed_at = CURRENT_TIMESTAMP`,
    [
      userId, bestCandidate, wrappedYear,
      bestScore.toFixed(4),
      bestBreakdown.rating_similarity.toFixed(4),
      bestBreakdown.genre_similarity.toFixed(4),
      bestBreakdown.actor_similarity.toFixed(4),
      bestBreakdown.mood_similarity.toFixed(4),
      bestBreakdown.director_similarity.toFixed(4),
      bestBreakdown.disliked_similarity.toFixed(4),
      bestBreakdown.sharedMovies.length,
      topShared,
      sharedDisliked,
    ]
  );

  return { matched_user_id: bestCandidate, similarity_score: bestScore };
};


export const getMyMatch = async (
  userId: number,
  wrappedYear: number = new Date().getFullYear()
) => {
  const result = await pool.query(
    `SELECT
       sm.matched_user_id,
       sm.wrapped_year,
       sm.similarity_score,
       sm.rating_similarity,
       sm.genre_similarity,
       sm.actor_similarity,
       sm.mood_similarity,
       sm.director_similarity,
       sm.disliked_similarity,
       sm.shared_movies_count,
       sm.top_shared_movies,
       sm.shared_disliked,
       sm.computed_at,
       u.id AS matched_id,
       u.username AS matched_username,
       u.first_name AS matched_first_name,
       u.last_name AS matched_last_name,
       u.profile_image_url AS matched_profile_image_url
     FROM user_soulmate_matches sm
     JOIN users u ON u.id = sm.matched_user_id
     WHERE sm.user_id = $1 AND sm.wrapped_year = $2`,
    [userId, wrappedYear]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0];
};