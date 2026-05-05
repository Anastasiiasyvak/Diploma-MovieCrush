import pool from '../../config/database';
import {
  BasicStats,
  TopGenreResult,
  TopDirectorResult,
  TopMoodResult,
  TopFanResult,
  WrappedTopActor,
  WrappedWatchHabits,
} from './wrapped.types';

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

const safeInt = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const computeBasicStats = async (userId: number, year: number): Promise<BasicStats> => {
  const result = await pool.query(
    `SELECT
       COALESCE(SUM(c.runtime_minutes) FILTER (WHERE c.media_type = 'movie'), 0)::int AS total_minutes,       
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

  const episodeMinutesResult = await pool.query(
    `SELECT COALESCE(SUM(c.runtime_minutes), 0)::int AS episode_minutes
     FROM user_episode_watches ew
     JOIN tmdb_media_cache c
          ON c.tmdb_id = ew.series_tmdb_id AND c.media_type = 'tv'
     WHERE ew.user_id = $1
       AND EXTRACT(YEAR FROM ew.watched_at) = $2`,
    [userId, year]
  );

  const decadeResult = await pool.query(
    `SELECT (FLOOR(c.release_year / 10) * 10)::int AS decade, COUNT(*)::int AS cnt
     FROM list_items li
     JOIN user_lists ul ON ul.id = li.list_id
     JOIN tmdb_media_cache c ON c.tmdb_id = li.tmdb_id AND c.media_type = li.media_type
     WHERE ul.user_id = $1
       AND ul.list_type = 'watched'
       AND EXTRACT(YEAR FROM li.added_at) = $2
       AND c.release_year IS NOT NULL
     GROUP BY decade
     ORDER BY cnt DESC`,
    [userId, year]
  );

  const row = result.rows[0];
  const episodeMinutes = Number(episodeMinutesResult.rows[0]?.episode_minutes) || 0;
  const totalMin = (Number(row.total_minutes) || 0) + episodeMinutes;

  const decades = decadeResult.rows as { decade: number; cnt: number }[];
  const totalDecadeCount = decades.reduce((s, d) => s + d.cnt, 0);

  let cinema_vibe: string | null = null;
  let cinema_vibe_stat: string | null = null;

  if (decades.length > 0 && totalDecadeCount > 0) {
    const top = decades[0];
    const topPct = Math.round((top.cnt / totalDecadeCount) * 100);
    const decadesWithTenPct = decades.filter(d => (d.cnt / totalDecadeCount) >= 0.10).length;
    const classicCount = decades.filter(d => d.decade < 2000).reduce((s, d) => s + d.cnt, 0);
    const classicPct = Math.round((classicCount / totalDecadeCount) * 100);

    if (topPct >= 60 && top.decade >= 2020) {
      cinema_vibe = 'Modern Watcher 🆕';
      cinema_vibe_stat = `${topPct}% of your watches were from the 2020s. You love the now.`;
    } else if (decadesWithTenPct >= 3) {
      cinema_vibe = 'Time Traveler 🕰️';
      cinema_vibe_stat = `You watch across ${decadesWithTenPct} different decades. No era is off limits.`;
    } else if (classicPct >= 30) {
      cinema_vibe = 'Classic Soul 🎞️';
      cinema_vibe_stat = `${classicPct}% of your watches were pre-2000. You appreciate the golden era.`;
    } else {
      cinema_vibe = 'Decade Surfer 🏄';
      cinema_vibe_stat = `Your top decade is the ${top.decade}s - but you travel easily across eras.`;
    }
  }

  return {
    total_minutes:    totalMin,
    total_hours:      Math.round(totalMin / 60),
    total_days:       Number((totalMin / 60 / 24).toFixed(1)),
    cinema_vibe,
    cinema_vibe_stat,
    movies_count:     Number(row.movies_count) || 0,
    series_count:     Number(row.series_count) || 0,
  };
};

const computeEpisodesCount = async (userId: number, year: number): Promise<number> => {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS cnt
     FROM user_episode_watches
     WHERE user_id = $1 AND EXTRACT(YEAR FROM watched_at) = $2`,
    [userId, year]
  );
  return Number(result.rows[0]?.cnt) || 0;
};

const computeTopGenre = async (userId: number, year: number): Promise<TopGenreResult> => {
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
     ),
     sessions AS (
       SELECT DISTINCT ON (DATE_TRUNC('hour', added_at))
         added_at
       FROM watched_times
       ORDER BY DATE_TRUNC('hour', added_at), added_at
     )
     SELECT
       (SELECT EXTRACT(DOW FROM added_at)::int FROM sessions
        GROUP BY EXTRACT(DOW FROM added_at) ORDER BY COUNT(*) DESC LIMIT 1) AS top_weekday,
       (SELECT EXTRACT(HOUR FROM added_at)::int FROM sessions
        GROUP BY EXTRACT(HOUR FROM added_at) ORDER BY COUNT(*) DESC LIMIT 1) AS top_hour`,
    [userId, year]
  );
  const row = result.rows[0];
  return {
    weekday: row?.top_weekday !== null && row?.top_weekday !== undefined ? Number(row.top_weekday) : null,
    hour:    row?.top_hour    !== null && row?.top_hour    !== undefined ? Number(row.top_hour)    : null,
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

  const percentileResult = await pool.query(
    `SELECT
       ROUND(
         COUNT(DISTINCT user_id)::numeric
         / NULLIF((SELECT COUNT(DISTINCT id) FROM users), 0) * 100,
         1
       ) AS pct
     FROM user_best_actor_votes
     WHERE actor_tmdb_id = $1`,
    [actorId]
  );
  const percentile = percentileResult.rows[0]?.pct
    ? Math.max(0.1, Number(percentileResult.rows[0].pct))
    : null;

  return {
    topfan_actor_id:   actorId,
    topfan_actor_name: topActor.actor_name,
    topfan_minutes:    myMinutes,
    topfan_percentile: percentile,
  };
};

export const computeWrappedForUser = async (
  userId: number,
  year: number = new Date().getFullYear()
): Promise<void> => {
  const [
    basics, episodes, topGenre, topDirector, topActors,
    topMood, habits, topFan,
  ] = await Promise.all([
    computeBasicStats(userId, year),
    computeEpisodesCount(userId, year),
    computeTopGenre(userId, year),
    computeTopDirector(userId, year),
    computeTopActors(userId, year),
    computeTopMood(userId, year),
    computeWatchHabits(userId, year),
    computeTopFan(userId, year),
  ]);

  await pool.query(
    `INSERT INTO user_wrapped_summary (
       user_id, wrapped_year,
       total_minutes, total_hours, total_days,
       cinema_vibe, cinema_vibe_stat,
       movies_count, series_count, episodes_count,
       top_genre_id, top_genre_name,
       top_director_id, top_director_name,
       top_actors,
       top_mood, mood_count,
       top_weekday, top_hour,
       topfan_actor_id, topfan_actor_name, topfan_minutes, topfan_percentile
     ) VALUES (
       $1, $2,
       $3, $4, $5,
       $6, $7,
       $8, $9, $10,
       $11, $12,
       $13, $14,
       $15::jsonb,
       $16, $17,
       $18, $19,
       $20, $21, $22, $23
     )
     ON CONFLICT (user_id, wrapped_year) DO UPDATE SET
       total_minutes      = EXCLUDED.total_minutes,
       total_hours        = EXCLUDED.total_hours,
       total_days         = EXCLUDED.total_days,
       cinema_vibe        = EXCLUDED.cinema_vibe,
       cinema_vibe_stat   = EXCLUDED.cinema_vibe_stat,
       movies_count       = EXCLUDED.movies_count,
       series_count       = EXCLUDED.series_count,
       episodes_count     = EXCLUDED.episodes_count,
       top_genre_id       = EXCLUDED.top_genre_id,
       top_genre_name     = EXCLUDED.top_genre_name,
       top_director_id    = EXCLUDED.top_director_id,
       top_director_name  = EXCLUDED.top_director_name,
       top_actors         = EXCLUDED.top_actors,
       top_mood           = EXCLUDED.top_mood,
       mood_count         = EXCLUDED.mood_count,
       top_weekday        = EXCLUDED.top_weekday,
       top_hour           = EXCLUDED.top_hour,
       topfan_actor_id    = EXCLUDED.topfan_actor_id,
       topfan_actor_name  = EXCLUDED.topfan_actor_name,
       topfan_minutes     = EXCLUDED.topfan_minutes,
       topfan_percentile  = EXCLUDED.topfan_percentile,
       computed_at        = CURRENT_TIMESTAMP`,
    [
      userId, year,
      basics.total_minutes, basics.total_hours, basics.total_days,
      basics.cinema_vibe, basics.cinema_vibe_stat,
      basics.movies_count, basics.series_count, episodes,
      topGenre.top_genre_id, topGenre.top_genre_name,
      topDirector.top_director_id, topDirector.top_director_name,
      JSON.stringify(topActors),
      topMood.top_mood, topMood.mood_count,
      habits.weekday, habits.hour,
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