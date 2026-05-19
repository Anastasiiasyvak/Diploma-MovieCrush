import pool from '../../config/database';
import {
  OnboardingActor,
  OnboardingMovie,
  OnboardingContent,
  CompleteOnboardingPayload,
} from './onboarding.types';


export const getOnboardingContent = async (batch = 1): Promise<OnboardingContent> => {
  const [actorsRes, moviesRes] = await Promise.all([
    pool.query<OnboardingActor>(`SELECT * FROM onboarding_actors ORDER BY id`),
    pool.query<OnboardingMovie>(
      `SELECT * FROM onboarding_movies WHERE batch = $1 ORDER BY id`,
      [batch]
    ),
  ]);

  return {
    actors: actorsRes.rows,
    movies: moviesRes.rows,
  };
};


export const hasCompletedOnboarding = async (userId: number): Promise<boolean> => {
  const res = await pool.query(
    `SELECT 1 FROM user_onboarding WHERE user_id = $1`,
    [userId]
  );
  return res.rowCount !== null && res.rowCount > 0;
};


export const completeOnboarding = async (
  userId: number,
  payload: CompleteOnboardingPayload
): Promise<void> => {
  const { liked_actor_ids, watched_tmdb_ids, ratings } = payload;

  await pool.query(
    `INSERT INTO user_onboarding (user_id, liked_actor_ids, watched_tmdb_ids, ratings)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id) DO UPDATE
       SET liked_actor_ids = EXCLUDED.liked_actor_ids,
           watched_tmdb_ids = EXCLUDED.watched_tmdb_ids,
           ratings = EXCLUDED.ratings,
           completed_at = CURRENT_TIMESTAMP`,
    [userId, liked_actor_ids, watched_tmdb_ids, JSON.stringify(ratings)]
  );


  if (watched_tmdb_ids.length > 0) {
    const values = watched_tmdb_ids
      .map((_, i) => `($1, $${i + 2}, TRUE)`)
      .join(', ');

    await pool.query(
      `INSERT INTO user_movie_actions (user_id, tmdb_id, is_watched)
       VALUES ${values}
       ON CONFLICT (user_id, tmdb_id) DO UPDATE SET is_watched = TRUE`,
      [userId, ...watched_tmdb_ids]
    );
  }

  const ratingEntries = Object.entries(ratings);
  for (const [tmdbIdStr, rating] of ratingEntries) {
    const tmdbId = Number(tmdbIdStr);
    await pool.query(
      `INSERT INTO user_detailed_ratings (user_id, tmdb_id, overall_rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, tmdb_id) DO UPDATE SET overall_rating = EXCLUDED.overall_rating`,
      [userId, tmdbId, rating]
    );
  }
};