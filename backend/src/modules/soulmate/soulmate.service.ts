import pool from '../../config/database';
import { SimilarityBreakdown } from './soulmate.types';
import {
  MIN_RATING_OVERLAP,
  MIN_USER_MOVIES,
  MIN_SCORE_THRESHOLD,
  cosineSimilarity,
  cosineSimilarityFromCounts,
  jaccard,
  weightedSum,
  isRecomputeThrottled,
  buildRatingVectors,
} from './soulmate.math';

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

  const { vectorA, vectorB, sharedMovies } = buildRatingVectors(result.rows);
  const similarity = cosineSimilarity(vectorA, vectorB);
  return { similarity, sharedMovies };
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

  return cosineSimilarityFromCounts(moodsA, moodsB);
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
    disliked,
  ] = await Promise.all([
    computeRatingCosineSimilarity(userA, userB),
    computeWatchedOverlap(userA, userB),
    computeActorOverlap(userA, userB),
    computeMoodSimilarity(userA, userB),
    computeDislikedOverlap(userA, userB),
  ]);

  const total = weightedSum({
    rating: rating.similarity,
    genre,
    actor,
    mood,
    disliked: disliked.similarity,
  });

  return {
    total,
    rating_similarity: rating.similarity,
    genre_similarity: genre,
    actor_similarity: actor,
    mood_similarity: mood,
    director_similarity: 0,
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

export const getLastComputedAt = async (
  userId: number,
  year: number
): Promise<Date | null> => {
  const result = await pool.query(
    `SELECT computed_at FROM user_soulmate_matches
     WHERE user_id = $1 AND wrapped_year = $2`,
    [userId, year]
  );
  if (result.rows.length === 0) return null;
  return new Date(result.rows[0].computed_at);
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

  const lastComputed = await getLastComputedAt(userId, wrappedYear);
  if (isRecomputeThrottled(lastComputed)) {
    throw new Error('Soulmate recompute throttled');
  }

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