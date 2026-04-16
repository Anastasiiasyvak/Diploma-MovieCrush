import pool from '../../config/database';

export interface EpisodeWatchInput {
  series_tmdb_id: number;
  season_number: number;
  episode_number: number;
  episode_tmdb_id?: number;
  total_episodes_in_series?: number;
  total_seasons_in_series?: number;
}

export const getWatchedEpisodes = async (
  userId: number, seriesTmdbId: number
): Promise<{ season_number: number; episode_number: number }[]> => {
  const result = await pool.query(
    `SELECT season_number, episode_number
     FROM user_episode_watches
     WHERE user_id = $1 AND series_tmdb_id = $2`,
    [userId, seriesTmdbId]
  );
  return result.rows;
};

export const toggleEpisodeWatch = async (
  userId: number, input: EpisodeWatchInput
): Promise<{ is_watched: boolean; episodes_watched_count: number }> => {
  const { series_tmdb_id, season_number, episode_number, episode_tmdb_id } = input;

  const existing = await pool.query(
    `SELECT id FROM user_episode_watches
     WHERE user_id = $1 AND series_tmdb_id = $2
       AND season_number = $3 AND episode_number = $4`,
    [userId, series_tmdb_id, season_number, episode_number]
  );

  let is_watched: boolean;

  if (existing.rows.length > 0) {
    await pool.query(
      `DELETE FROM user_episode_watches
       WHERE user_id = $1 AND series_tmdb_id = $2
         AND season_number = $3 AND episode_number = $4`,
      [userId, series_tmdb_id, season_number, episode_number]
    );
    is_watched = false;
  } else {
    await pool.query(
      `INSERT INTO user_episode_watches
         (user_id, series_tmdb_id, season_number, episode_number, episode_tmdb_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, series_tmdb_id, season_number, episode_number, episode_tmdb_id ?? null]
    );
    is_watched = true;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) AS cnt FROM user_episode_watches
     WHERE user_id = $1 AND series_tmdb_id = $2`,
    [userId, series_tmdb_id]
  );
  const episodes_watched_count = Number(countResult.rows[0].cnt);

  // я тут оновлюю лічильник скільки юзер подивився епізодів
  await pool.query(
    `UPDATE users SET episodes_watched = (
       SELECT COUNT(*) FROM user_episode_watches WHERE user_id = $1
     ), updated_at = NOW() WHERE id = $1`,
    [userId]
  );

  if (is_watched && input.total_episodes_in_series) {
    if (episodes_watched_count >= input.total_episodes_in_series) {
      await pool.query(
        `INSERT INTO user_movie_actions (user_id, tmdb_id, is_watched)
         VALUES ($1, $2, TRUE)
         ON CONFLICT (user_id, tmdb_id) DO UPDATE
           SET is_watched = TRUE, updated_at = NOW()`,
        [userId, series_tmdb_id]
      );
      const watchedList = await pool.query(
        `SELECT id FROM user_lists WHERE user_id = $1 AND list_type = 'watched'`, [userId]
      );
      if (watchedList.rows.length > 0) {
        await pool.query(
          `INSERT INTO list_items (list_id, tmdb_id, media_type) VALUES ($1, $2, 'tv')
           ON CONFLICT DO NOTHING`,
          [watchedList.rows[0].id, series_tmdb_id]
        );
      }
      await pool.query(
        `UPDATE users SET series_watched = (
           SELECT COUNT(DISTINCT tmdb_id) FROM user_movie_actions
           WHERE user_id = $1 AND is_watched = TRUE
           AND tmdb_id IN (
             SELECT DISTINCT series_tmdb_id FROM user_episode_watches WHERE user_id = $1
           )
         ), updated_at = NOW() WHERE id = $1`,
        [userId]
      );
    }
  }

  return { is_watched, episodes_watched_count };
};

export const getSeasonWatchedCount = async (
  userId: number, seriesTmdbId: number, seasonNumber: number
): Promise<number> => {
  const result = await pool.query(
    `SELECT COUNT(*) AS cnt FROM user_episode_watches
     WHERE user_id = $1 AND series_tmdb_id = $2 AND season_number = $3`,
    [userId, seriesTmdbId, seasonNumber]
  );
  return Number(result.rows[0].cnt);
};