// backend/src/modules/wrapped/wrapped.service.ts
//
// Обчислення MovieCrush Wrapped — річна аналітика юзера (Spotify-style).
//
// ПРИНЦИП РОБОТИ:
//   1. Всі дані вже є в БД (включно з tmdb_media_cache, що заповнюється
//      під час дій юзера).
//   2. Виконуємо ~13 SQL-запитів, агрегуємо за рік.
//   3. Зберігаємо результат у user_wrapped_summary з UNIQUE (user_id, year).
//   4. Mobile читає вже обчислений summary — швидко.

import pool from '../../config/database';
import {
  BasicStats,
  TopGenreResult,
  TopDirectorResult,
  TopMoodResult,
  TopFanResult,
  WrappedTopActor,
  WrappedTopMovie,
  WrappedWatchHabits,
} from './wrapped.types';

// ── Genre name lookup (TMDB IDs → name) ──────────────────────────────────
const GENRE_NAMES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics',
};

// ── Slide computations ────────────────────────────────────────────────────

const computeBasicStats = async (userId: number, year: number): Promise<BasicStats> => {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(c.runtime_minutes), 0)::int  AS total_minutes,
       AVG(c.release_year)                       AS avg_release_year,
       COUNT(*) FILTER (WHERE c.media_type = 'movie')::int AS movies_count,
       COUNT(*) FILTER (WHERE c.media_type = 'tv')::int    AS series_count
     FROM list_items li
     JOIN user_lists ul ON ul.id = li.list_id
     JOIN tmdb_media_cache c
          ON c.tmdb_id = li.tmdb_id AND c.media_type = li.media_type
     WHERE ul.user_id = $1
       AND ul.list_type = 'watched'
       AND EXTRACT(YEAR FROM li.added_at) = $2`,
    [userId, year]
  );
  const row = result.rows[0];
  const totalMin = Number(row.total_minutes) || 0;
  const avgYear = row.avg_release_year ? Number(row.avg_release_year) : null;

  return {
    total_minutes:    totalMin,
    total_hours:      Math.round(totalMin / 60),
    total_days:       Number((totalMin / 60 / 24).toFixed(1)),
    avg_release_year: avgYear,
    cinema_age:       avgYear ? Math.round(year - avgYear) : null,
    movies_count:     Number(row.movies_count) || 0,
    series_count:     Number(row.series_count) || 0,
  };
};

const computeEpisodesCount = async (userId: number, year: number): Promise<number> => {
  // У нас episodes ratings зберігаються через композитний tmdb_id у
  // user_detailed_ratings. Лічимо як кількість таких записів за рік.
  const result = await pool.query(
    `SELECT COUNT(*)::int AS cnt
     FROM user_detailed_ratings
     WHERE user_id = $1
       AND tmdb_id > 100000000
       AND EXTRACT(YEAR FROM created_at) = $2`,
    [userId, year]
  );
  return Number(result.rows[0]?.cnt) || 0;
};

const computeTopGenre = async (userId: number, year: number): Promise<TopGenreResult> => {
  // CROSS JOIN LATERAL UNNEST йде В FROM-блоці, не після WHERE.
  // Так "розгортаємо" genre_ids array у окремі рядки і групуємо.
  const result = await pool.query(
    `SELECT g.genre_id, COUNT(*)::int AS cnt
     FROM list_items li
     JOIN user_lists ul
          ON ul.id = li.list_id
     JOIN tmdb_media_cache c
          ON c.tmdb_id = li.tmdb_id AND c.media_type = li.media_type
     CROSS JOIN LATERAL UNNEST(c.genre_ids) AS g(genre_id)
     WHERE ul.user_id = $1
       AND ul.list_type = 'watched'
       AND EXTRACT(YEAR FROM li.added_at) = $2
     GROUP BY g.genre_id
     ORDER BY cnt DESC
     LIMIT 1`,
    [userId, year]
  );
  const row = result.rows[0];
  if (!row) return { top_genre_id: null, top_genre_name: null };
  return {
    top_genre_id:   Number(row.genre_id),
    top_genre_name: GENRE_NAMES[Number(row.genre_id)] ?? 'Unknown',
  };
};

const computeTopDirector = async (userId: number, year: number): Promise<TopDirectorResult> => {
  const result = await pool.query(
    `SELECT c.director_tmdb_id, c.director_name, COUNT(*)::int AS cnt
     FROM list_items li
     JOIN user_lists ul ON ul.id = li.list_id
     JOIN tmdb_media_cache c
          ON c.tmdb_id = li.tmdb_id AND c.media_type = li.media_type
     WHERE ul.user_id = $1
       AND ul.list_type = 'watched'
       AND EXTRACT(YEAR FROM li.added_at) = $2
       AND c.director_tmdb_id IS NOT NULL
     GROUP BY c.director_tmdb_id, c.director_name
     ORDER BY cnt DESC
     LIMIT 1`,
    [userId, year]
  );
  const row = result.rows[0];
  if (!row) return { top_director_id: null, top_director_name: null };
  return {
    top_director_id:   Number(row.director_tmdb_id),
    top_director_name: row.director_name,
  };
};

const computeTopActors = async (userId: number, year: number): Promise<WrappedTopActor[]> => {
  const result = await pool.query(
    `SELECT actor_tmdb_id, actor_name, COUNT(*)::int AS votes
     FROM user_best_actor_votes
     WHERE user_id = $1
       AND EXTRACT(YEAR FROM created_at) = $2
     GROUP BY actor_tmdb_id, actor_name
     ORDER BY votes DESC
     LIMIT 5`,
    [userId, year]
  );
  return result.rows.map(r => ({
    tmdb_id: Number(r.actor_tmdb_id),
    name:    r.actor_name,
    votes:   Number(r.votes),
  }));
};

const computeTopMovie = async (userId: number, year: number): Promise<WrappedTopMovie | null> => {
  const result = await pool.query(
    `SELECT
       udr.tmdb_id,
       udr.overall_rating,
       c.title,
       c.poster_path,
       (SELECT EXISTS (
         SELECT 1 FROM user_movie_actions
         WHERE user_id = udr.user_id AND tmdb_id = udr.tmdb_id AND is_favorite = TRUE
       )) AS is_favorite
     FROM user_detailed_ratings udr
     LEFT JOIN tmdb_media_cache c
       ON c.tmdb_id = udr.tmdb_id AND c.media_type = 'movie'
     WHERE udr.user_id = $1
       AND EXTRACT(YEAR FROM udr.created_at) = $2
       AND udr.overall_rating IS NOT NULL
     ORDER BY is_favorite DESC, udr.overall_rating DESC, udr.created_at DESC
     LIMIT 1`,
    [userId, year]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    tmdb_id:        Number(row.tmdb_id),
    title:          row.title ?? 'Unknown',
    poster_path:    row.poster_path ?? null,
    overall_rating: Number(row.overall_rating),
  };
};

const computeTopMood = async (userId: number, year: number): Promise<TopMoodResult> => {
  const result = await pool.query(
    `SELECT mood, COUNT(*)::int AS cnt
     FROM user_movie_moods
     WHERE user_id = $1
       AND EXTRACT(YEAR FROM created_at) = $2
     GROUP BY mood
     ORDER BY cnt DESC
     LIMIT 1`,
    [userId, year]
  );
  const row = result.rows[0];
  if (!row) return { top_mood: null, mood_count: 0 };
  return { top_mood: row.mood, mood_count: Number(row.cnt) };
};

const computeWatchHabits = async (userId: number, year: number): Promise<WrappedWatchHabits> => {
  const result = await pool.query(
    `WITH watched_times AS (
       SELECT li.added_at
       FROM list_items li
       JOIN user_lists ul ON ul.id = li.list_id
       WHERE ul.user_id = $1
         AND ul.list_type = 'watched'
         AND EXTRACT(YEAR FROM li.added_at) = $2
     )
     SELECT
       (SELECT EXTRACT(DOW FROM added_at)::int FROM watched_times
        GROUP BY EXTRACT(DOW FROM added_at) ORDER BY COUNT(*) DESC LIMIT 1) AS top_weekday,
       (SELECT EXTRACT(HOUR FROM added_at)::int FROM watched_times
        GROUP BY EXTRACT(HOUR FROM added_at) ORDER BY COUNT(*) DESC LIMIT 1) AS top_hour,
       (SELECT EXTRACT(MONTH FROM added_at)::int FROM watched_times
        GROUP BY EXTRACT(MONTH FROM added_at) ORDER BY COUNT(*) DESC LIMIT 1) AS top_month`,
    [userId, year]
  );
  const row = result.rows[0];
  return {
    weekday: row?.top_weekday !== null && row?.top_weekday !== undefined ? Number(row.top_weekday) : null,
    hour:    row?.top_hour    !== null && row?.top_hour    !== undefined ? Number(row.top_hour)    : null,
    month:   row?.top_month   !== null && row?.top_month   !== undefined ? Number(row.top_month)   : null,
  };
};

const computeTopFan = async (userId: number, year: number): Promise<TopFanResult> => {
  const topActorResult = await pool.query(
    `SELECT actor_tmdb_id, actor_name
     FROM user_best_actor_votes
     WHERE user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2
     GROUP BY actor_tmdb_id, actor_name
     ORDER BY COUNT(*) DESC
     LIMIT 1`,
    [userId, year]
  );
  const topActor = topActorResult.rows[0];
  if (!topActor) {
    return {
      topfan_actor_id: null, topfan_actor_name: null,
      topfan_minutes: 0, topfan_percentile: null,
    };
  }

  const actorId = Number(topActor.actor_tmdb_id);

  const minutesResult = await pool.query(
    `SELECT COALESCE(SUM(c.runtime_minutes), 0)::int AS minutes
     FROM list_items li
     JOIN user_lists ul ON ul.id = li.list_id
     JOIN tmdb_media_cache c
          ON c.tmdb_id = li.tmdb_id AND c.media_type = li.media_type
     WHERE ul.user_id = $1
       AND ul.list_type = 'watched'
       AND EXTRACT(YEAR FROM li.added_at) = $2
       AND c.top_cast @> $3::jsonb`,
    [userId, year, JSON.stringify([{ tmdb_id: actorId }])]
  );
  const myMinutes = Number(minutesResult.rows[0]?.minutes) || 0;

  // Percentile: "ти серед топ X% фанатів цього актора".
  const percentileResult = await pool.query(
    `WITH user_minutes AS (
       SELECT
         ul.user_id,
         COALESCE(SUM(c.runtime_minutes), 0)::int AS minutes
       FROM list_items li
       JOIN user_lists ul ON ul.id = li.list_id
       JOIN tmdb_media_cache c
            ON c.tmdb_id = li.tmdb_id AND c.media_type = li.media_type
       WHERE ul.list_type = 'watched'
         AND EXTRACT(YEAR FROM li.added_at) = $1
         AND c.top_cast @> $2::jsonb
       GROUP BY ul.user_id
     )
     SELECT
       (1 - PERCENT_RANK() OVER (ORDER BY minutes ASC))::numeric * 100 AS pct,
       user_id
     FROM user_minutes
     WHERE user_id = $3
     LIMIT 1`,
    [year, JSON.stringify([{ tmdb_id: actorId }]), userId]
  );
  const percentile = percentileResult.rows[0]?.pct
    ? Math.max(1, Math.round(Number(percentileResult.rows[0].pct) * 100) / 100)
    : null;

  return {
    topfan_actor_id:   actorId,
    topfan_actor_name: topActor.actor_name,
    topfan_minutes:    myMinutes,
    topfan_percentile: percentile,
  };
};

// ── Main: compute and persist ─────────────────────────────────────────────

export const computeWrappedForUser = async (
  userId: number,
  year: number = new Date().getFullYear()
): Promise<void> => {
  const [
    basics, episodes, topGenre, topDirector, topActors, topMovie,
    topMood, habits, topFan,
  ] = await Promise.all([
    computeBasicStats(userId, year),
    computeEpisodesCount(userId, year),
    computeTopGenre(userId, year),
    computeTopDirector(userId, year),
    computeTopActors(userId, year),
    computeTopMovie(userId, year),
    computeTopMood(userId, year),
    computeWatchHabits(userId, year),
    computeTopFan(userId, year),
  ]);

  await pool.query(
    `INSERT INTO user_wrapped_summary (
       user_id, wrapped_year,
       total_minutes, total_hours, total_days,
       avg_release_year, cinema_age,
       movies_count, series_count, episodes_count,
       top_genre_id, top_genre_name,
       top_director_id, top_director_name,
       top_actors,
       top_movie_tmdb_id, top_movie_title, top_movie_poster, top_movie_rating,
       top_mood, mood_count,
       top_weekday, top_hour, top_month,
       topfan_actor_id, topfan_actor_name, topfan_minutes, topfan_percentile
     ) VALUES (
       $1, $2,
       $3, $4, $5,
       $6, $7,
       $8, $9, $10,
       $11, $12,
       $13, $14,
       $15::jsonb,
       $16, $17, $18, $19,
       $20, $21,
       $22, $23, $24,
       $25, $26, $27, $28
     )
     ON CONFLICT (user_id, wrapped_year) DO UPDATE SET
       total_minutes      = EXCLUDED.total_minutes,
       total_hours        = EXCLUDED.total_hours,
       total_days         = EXCLUDED.total_days,
       avg_release_year   = EXCLUDED.avg_release_year,
       cinema_age         = EXCLUDED.cinema_age,
       movies_count       = EXCLUDED.movies_count,
       series_count       = EXCLUDED.series_count,
       episodes_count     = EXCLUDED.episodes_count,
       top_genre_id       = EXCLUDED.top_genre_id,
       top_genre_name     = EXCLUDED.top_genre_name,
       top_director_id    = EXCLUDED.top_director_id,
       top_director_name  = EXCLUDED.top_director_name,
       top_actors         = EXCLUDED.top_actors,
       top_movie_tmdb_id  = EXCLUDED.top_movie_tmdb_id,
       top_movie_title    = EXCLUDED.top_movie_title,
       top_movie_poster   = EXCLUDED.top_movie_poster,
       top_movie_rating   = EXCLUDED.top_movie_rating,
       top_mood           = EXCLUDED.top_mood,
       mood_count         = EXCLUDED.mood_count,
       top_weekday        = EXCLUDED.top_weekday,
       top_hour           = EXCLUDED.top_hour,
       top_month          = EXCLUDED.top_month,
       topfan_actor_id    = EXCLUDED.topfan_actor_id,
       topfan_actor_name  = EXCLUDED.topfan_actor_name,
       topfan_minutes     = EXCLUDED.topfan_minutes,
       topfan_percentile  = EXCLUDED.topfan_percentile,
       computed_at        = CURRENT_TIMESTAMP`,
    [
      userId, year,
      basics.total_minutes, basics.total_hours, basics.total_days,
      basics.avg_release_year, basics.cinema_age,
      basics.movies_count, basics.series_count, episodes,
      topGenre.top_genre_id, topGenre.top_genre_name,
      topDirector.top_director_id, topDirector.top_director_name,
      JSON.stringify(topActors),
      topMovie?.tmdb_id ?? null, topMovie?.title ?? null,
      topMovie?.poster_path ?? null, topMovie?.overall_rating ?? null,
      topMood.top_mood, topMood.mood_count,
      habits.weekday, habits.hour, habits.month,
      topFan.topfan_actor_id, topFan.topfan_actor_name,
      topFan.topfan_minutes, topFan.topfan_percentile,
    ]
  );
};

export const getWrappedSummary = async (
  userId: number,
  year: number = new Date().getFullYear()
) => {
  const result = await pool.query(
    `SELECT * FROM user_wrapped_summary
     WHERE user_id = $1 AND wrapped_year = $2`,
    [userId, year]
  );
  return result.rows[0] ?? null;
}; 