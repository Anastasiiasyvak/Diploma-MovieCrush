import pool from '../../config/database';
import {
  OnboardingActor,
  OnboardingMovie,
  OnboardingContent,
  CompleteOnboardingPayload,
} from './onboarding.types';
import logger from '../../config/logger';


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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
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
        .map((_, i) => `($1, $${i + 2}, TRUE, NOW())`)
        .join(', ');

      await client.query(
        `INSERT INTO user_movie_actions (user_id, tmdb_id, is_watched, updated_at)
         VALUES ${values}
         ON CONFLICT (user_id, tmdb_id) DO UPDATE
           SET is_watched = TRUE, updated_at = NOW()`,
        [userId, ...watched_tmdb_ids]
      );

      const mediaTypeRes = await client.query<{ tmdb_id: number; media_type: string }>(
        `SELECT tmdb_id, media_type FROM onboarding_movies
         WHERE tmdb_id = ANY($1::int[])`,
        [watched_tmdb_ids]
      );
      const mediaTypeMap = new Map<number, string>(
        mediaTypeRes.rows.map(r => [r.tmdb_id, r.media_type])
      );

      const watchedList = await client.query(
        `SELECT id FROM user_lists WHERE user_id = $1 AND list_type = 'watched' LIMIT 1`,
        [userId]
      );
      if (watchedList.rows.length > 0) {
        const listId = watchedList.rows[0].id;
        const listValues: (number | string)[] = [];
        const listRows = watched_tmdb_ids.map((tmdbId, i) => {
          const offset = i * 3;
          listValues.push(listId, tmdbId, mediaTypeMap.get(tmdbId) ?? 'movie');
          return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
        });

        await client.query(
          `INSERT INTO list_items (list_id, tmdb_id, media_type)
           VALUES ${listRows.join(', ')}
           ON CONFLICT DO NOTHING`,
          listValues
        );
      }

      await client.query(
        `UPDATE users
         SET movies_watched = (
           SELECT COUNT(*) FROM user_movie_actions
           WHERE user_id = $1 AND is_watched = TRUE
         ), updated_at = NOW()
         WHERE id = $1`,
        [userId]
      );
    }

    const ratingEntries = Object.entries(ratings);
    if (ratingEntries.length > 0) {
      const ratingValues: number[] = [];
      const ratingRows = ratingEntries.map(([tmdbIdStr, rating], i) => {
        const offset = i * 3;
        ratingValues.push(userId, Number(tmdbIdStr), Number(rating));
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, NOW())`;
      });

      await client.query(
        `INSERT INTO user_detailed_ratings (user_id, tmdb_id, overall_rating, updated_at)
         VALUES ${ratingRows.join(', ')}
         ON CONFLICT (user_id, tmdb_id) DO UPDATE
           SET overall_rating = EXCLUDED.overall_rating, updated_at = NOW()`,
        ratingValues
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ err: error, userId }, 'completeOnboarding failed');
    throw error;
  } finally {
    client.release();
  }
};