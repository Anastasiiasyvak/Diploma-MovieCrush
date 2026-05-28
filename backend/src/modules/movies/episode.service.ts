import pool from '../../config/database';
import { fetchFromTMDB } from '../tmdb/tmdb.service';
import { buildAllEpisodesList, SeasonSummary } from './episode.helpers';

export interface EpisodeWatchInput {
  series_tmdb_id: number;
  season_number: number;
  episode_number: number;
  episode_tmdb_id?: number;
  total_episodes_in_series?: number;
  total_seasons_in_series?: number;
}

interface TmdbSeriesDetails {
  seasons: SeasonSummary[];
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

const addSeriesToWatched = async (client: any, userId: number, seriesTmdbId: number) => {
  await client.query(
    `INSERT INTO user_movie_actions (user_id, tmdb_id, is_watched)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (user_id, tmdb_id) DO UPDATE
       SET is_watched = TRUE, updated_at = NOW()`,
    [userId, seriesTmdbId]
  );

  const watchedList = await client.query(
    `SELECT id FROM user_lists WHERE user_id = $1 AND list_type = 'watched'`,
    [userId]
  );
  if (watchedList.rows.length > 0) {
    await client.query(
      `INSERT INTO list_items (list_id, tmdb_id, media_type) VALUES ($1, $2, 'tv')
       ON CONFLICT DO NOTHING`,
      [watchedList.rows[0].id, seriesTmdbId]
    );
  }

  await client.query(
    `UPDATE users SET series_watched = (
       SELECT COUNT(DISTINCT li.tmdb_id)
       FROM list_items li
       JOIN user_lists ul ON ul.id = li.list_id
       WHERE ul.user_id = $1 AND ul.list_type = 'watched' AND li.media_type = 'tv'
     ), updated_at = NOW() WHERE id = $1`,
    [userId]
  );
};

const recountEpisodesWatched = async (client: any, userId: number) => {
  await client.query(
    `UPDATE users SET episodes_watched = (
       SELECT COUNT(*) FROM user_episode_watches WHERE user_id = $1
     ), updated_at = NOW() WHERE id = $1`,
    [userId]
  );
};

export const toggleEpisodeWatch = async (
  userId: number, input: EpisodeWatchInput
): Promise<{ is_watched: boolean; episodes_watched_count: number }> => {
  const { series_tmdb_id, season_number, episode_number, episode_tmdb_id } = input;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT id FROM user_episode_watches
       WHERE user_id = $1 AND series_tmdb_id = $2
         AND season_number = $3 AND episode_number = $4`,
      [userId, series_tmdb_id, season_number, episode_number]
    );

    let is_watched: boolean;

    if (existing.rows.length > 0) {
      await client.query(
        `DELETE FROM user_episode_watches
         WHERE user_id = $1 AND series_tmdb_id = $2
           AND season_number = $3 AND episode_number = $4`,
        [userId, series_tmdb_id, season_number, episode_number]
      );
      is_watched = false;
    } else {
      await client.query(
        `INSERT INTO user_episode_watches
           (user_id, series_tmdb_id, season_number, episode_number, episode_tmdb_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [userId, series_tmdb_id, season_number, episode_number, episode_tmdb_id ?? null]
      );
      is_watched = true;
    }

    const countResult = await client.query(
      `SELECT COUNT(*) AS cnt FROM user_episode_watches
       WHERE user_id = $1 AND series_tmdb_id = $2`,
      [userId, series_tmdb_id]
    );
    const episodes_watched_count = Number(countResult.rows[0].cnt);

    await recountEpisodesWatched(client, userId);

    // якщо хочаб один епізод переглянути то серіал у вотчед
    if (is_watched && episodes_watched_count >= 1) {
      await addSeriesToWatched(client, userId, series_tmdb_id);
    }

    await client.query('COMMIT');
    return { is_watched, episodes_watched_count };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('toggleEpisodeWatch failed for user', userId, 'series', series_tmdb_id, error);
    throw error;
  } finally {
    client.release();
  }
};

export const markAllEpisodesWatched = async (
  userId: number, seriesTmdbId: number
): Promise<{ episodes_added: number; episodes_watched_count: number }> => {
  const details = await fetchFromTMDB<TmdbSeriesDetails>(`/tv/${seriesTmdbId}`);
  const allEpisodes = buildAllEpisodesList(details.seasons);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const { season, episode } of allEpisodes) {
      await client.query(
        `INSERT INTO user_episode_watches
           (user_id, series_tmdb_id, season_number, episode_number)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [userId, seriesTmdbId, season, episode]
      );
    }

    await addSeriesToWatched(client, userId, seriesTmdbId);
    await recountEpisodesWatched(client, userId);

    const countResult = await client.query(
      `SELECT COUNT(*) AS cnt FROM user_episode_watches
       WHERE user_id = $1 AND series_tmdb_id = $2`,
      [userId, seriesTmdbId]
    );

    await client.query('COMMIT');
    return {
      episodes_added: allEpisodes.length,
      episodes_watched_count: Number(countResult.rows[0].cnt),
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('markAllEpisodesWatched failed for user', userId, 'series', seriesTmdbId, error);
    throw error;
  } finally {
    client.release();
  }
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