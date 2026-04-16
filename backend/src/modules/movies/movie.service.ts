import pool from '../../config/database';
import {
  MovieActionsResponse, ToggleActionInput,
  AddToListInput, DetailedRatingInput, DetailedRatingResponse,
  MoodInput, MoodType, CommentInput, CommentResponse,
  BestActorVoteInput,
} from './movie.types';


export const getMovieActions = async (
  userId: number, tmdbId: number
): Promise<MovieActionsResponse> => {
  const result = await pool.query(
    `SELECT is_favorite, is_watchlist, is_watched, is_disliked
     FROM user_movie_actions WHERE user_id = $1 AND tmdb_id = $2`,
    [userId, tmdbId]
  );
  return result.rows[0] ?? { is_favorite: false, is_watchlist: false, is_watched: false, is_disliked: false };
};

export const toggleMovieAction = async (
  userId: number, input: ToggleActionInput
): Promise<MovieActionsResponse> => {
  const colMap: Record<string, string> = {
    favorite:  'is_favorite',
    watchlist: 'is_watchlist',
    watched:   'is_watched',
    dislike:   'is_disliked',
  };
  const col = colMap[input.action];

  await pool.query(
    `INSERT INTO user_movie_actions (user_id, tmdb_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, tmdb_id) DO NOTHING`,
    [userId, input.tmdb_id]
  );

  const current = await pool.query(
    `SELECT ${col} FROM user_movie_actions WHERE user_id = $1 AND tmdb_id = $2`,
    [userId, input.tmdb_id]
  );
  const newValue = !current.rows[0][col];

  await pool.query(
    `UPDATE user_movie_actions SET ${col} = $1, updated_at = NOW()
     WHERE user_id = $2 AND tmdb_id = $3`,
    [newValue, userId, input.tmdb_id]
  );

  if (input.action === 'favorite' && newValue) {
    await pool.query(
      `UPDATE user_movie_actions SET is_watched = TRUE, updated_at = NOW()
       WHERE user_id = $1 AND tmdb_id = $2`,
      [userId, input.tmdb_id]
    );
    const watchedList = await pool.query(
      `SELECT id FROM user_lists WHERE user_id = $1 AND list_type = 'watched'`, [userId]
    );
    if (watchedList.rows.length > 0) {
      await pool.query(
        `INSERT INTO list_items (list_id, tmdb_id, media_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [watchedList.rows[0].id, input.tmdb_id, input.media_type]
      );
    }
  }

  const listTypeMap: Record<string, string> = {
    favorite:  'favorites',
    watchlist: 'watchlist',
    watched:   'watched',
  };
  const listType = listTypeMap[input.action];
  if (listType) {
    const listRes = await pool.query(
      `SELECT id FROM user_lists WHERE user_id = $1 AND list_type = $2`,
      [userId, listType]
    );
    if (listRes.rows.length > 0) {
      if (newValue) {
        await pool.query(
          `INSERT INTO list_items (list_id, tmdb_id, media_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
          [listRes.rows[0].id, input.tmdb_id, input.media_type]
        );
      } else {
        await pool.query(
          `DELETE FROM list_items WHERE list_id = $1 AND tmdb_id = $2`,
          [listRes.rows[0].id, input.tmdb_id]
        );
      }
    }
  }

  if (input.action === 'watched' || (input.action === 'favorite' && newValue)) {
    await pool.query(
      `UPDATE users SET movies_watched = (
        SELECT COUNT(DISTINCT li.tmdb_id)
        FROM list_items li
        JOIN user_lists ul ON ul.id = li.list_id
        WHERE ul.user_id = $1 AND ul.list_type = 'watched' AND li.media_type = 'movie'
      ), updated_at = NOW() WHERE id = $1`,
      [userId]
    );
    await pool.query(
      `UPDATE users SET series_watched = (
        SELECT COUNT(DISTINCT li.tmdb_id)
        FROM list_items li
        JOIN user_lists ul ON ul.id = li.list_id
        WHERE ul.user_id = $1 AND ul.list_type = 'watched' AND li.media_type = 'tv'
      ), updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  }

  const updated = await pool.query(
    `SELECT is_favorite, is_watchlist, is_watched, is_disliked
     FROM user_movie_actions WHERE user_id = $1 AND tmdb_id = $2`,
    [userId, input.tmdb_id]
  );
  return updated.rows[0];
};


export const getListItems = async (
  userId: number, listId: number
): Promise<{ tmdb_id: number; media_type: string; added_at: Date }[]> => {
  const listCheck = await pool.query(
    `SELECT id FROM user_lists WHERE id = $1 AND user_id = $2`, [listId, userId]
  );
  if (listCheck.rows.length === 0) throw new Error('List not found or not yours');

  const result = await pool.query(
    `SELECT tmdb_id, media_type, added_at FROM list_items WHERE list_id = $1 ORDER BY added_at DESC`,
    [listId]
  );
  return result.rows;
};

export const addToCustomList = async (
  userId: number, input: AddToListInput
): Promise<void> => {
  const listCheck = await pool.query(
    `SELECT id FROM user_lists WHERE id = $1 AND user_id = $2`, [input.list_id, userId]
  );
  if (listCheck.rows.length === 0) throw new Error('List not found or not yours');

  await pool.query(
    `INSERT INTO list_items (list_id, tmdb_id, media_type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
    [input.list_id, input.tmdb_id, input.media_type]
  );
};

export const removeFromCustomList = async (
  userId: number, listId: number, tmdbId: number
): Promise<{ list_type: string }> => {
  const listCheck = await pool.query(
    `SELECT id, list_type FROM user_lists WHERE id = $1 AND user_id = $2`, [listId, userId]
  );
  if (listCheck.rows.length === 0) throw new Error('List not found or not yours');

  const { list_type } = listCheck.rows[0];

  await pool.query(`DELETE FROM list_items WHERE list_id = $1 AND tmdb_id = $2`, [listId, tmdbId]);

  if (list_type === 'watched') {
    await pool.query(
      `UPDATE user_movie_actions SET is_watched = FALSE, updated_at = NOW()
       WHERE user_id = $1 AND tmdb_id = $2`,
      [userId, tmdbId]
    );
    await pool.query(
      `UPDATE users SET movies_watched = (
        SELECT COUNT(*) FROM user_movie_actions WHERE user_id = $1 AND is_watched = TRUE
       ), updated_at = NOW() WHERE id = $1`,
      [userId]
    );
    await pool.query(
      `DELETE FROM user_detailed_ratings WHERE user_id = $1 AND tmdb_id = $2`, [userId, tmdbId]
    );
    await pool.query(
      `DELETE FROM user_movie_moods WHERE user_id = $1 AND tmdb_id = $2`, [userId, tmdbId]
    );
    await pool.query(
      `DELETE FROM user_best_actor_votes WHERE user_id = $1 AND tmdb_id = $2`, [userId, tmdbId]
    );

  } else if (list_type === 'favorites') {
    await pool.query(
      `UPDATE user_movie_actions SET is_favorite = FALSE, updated_at = NOW()
       WHERE user_id = $1 AND tmdb_id = $2`,
      [userId, tmdbId]
    );

  } else if (list_type === 'watchlist') {
    await pool.query(
      `UPDATE user_movie_actions SET is_watchlist = FALSE, updated_at = NOW()
       WHERE user_id = $1 AND tmdb_id = $2`,
      [userId, tmdbId]
    );
  }

  return { list_type };
};

export const getUserCustomLists = async (userId: number) => {
  const result = await pool.query(
    `SELECT id, name, list_type, is_private FROM user_lists WHERE user_id = $1 ORDER BY created_at ASC`,
    [userId]
  );
  return result.rows;
};


export const getRating = async (
  userId: number, tmdbId: number
): Promise<DetailedRatingResponse> => {
  const result = await pool.query(
    `SELECT overall_rating, director_score, effects_score, script_score, music_score, acting_score
     FROM user_detailed_ratings WHERE user_id = $1 AND tmdb_id = $2`,
    [userId, tmdbId]
  );
  return result.rows[0] ?? {
    overall_rating: null, director_score: null, effects_score: null,
    script_score: null, music_score: null, acting_score: null,
  };
};

export const upsertRating = async (
  userId: number, input: DetailedRatingInput
): Promise<DetailedRatingResponse> => {
  if (input.overall_rating != null) {
    await pool.query(
      `INSERT INTO user_movie_actions (user_id, tmdb_id, is_watched)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (user_id, tmdb_id) DO UPDATE SET is_watched = TRUE, updated_at = NOW()`,
      [userId, input.tmdb_id]
    );
    const watchedList = await pool.query(
      `SELECT id FROM user_lists WHERE user_id = $1 AND list_type = 'watched'`, [userId]
    );
    if (watchedList.rows.length > 0) {
      await pool.query(
        `INSERT INTO list_items (list_id, tmdb_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [watchedList.rows[0].id, input.tmdb_id]
      );
    }
    await pool.query(
      `UPDATE users SET movies_watched = (
        SELECT COUNT(*) FROM user_movie_actions WHERE user_id = $1 AND is_watched = TRUE
       ), updated_at = NOW() WHERE id = $1`,
      [userId]
    );
  }

  const result = await pool.query(
    `INSERT INTO user_detailed_ratings
       (user_id, tmdb_id, overall_rating, director_score, effects_score, script_score, music_score, acting_score)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (user_id, tmdb_id) DO UPDATE SET
       overall_rating = COALESCE(EXCLUDED.overall_rating, user_detailed_ratings.overall_rating),
       director_score = COALESCE(EXCLUDED.director_score, user_detailed_ratings.director_score),
       effects_score  = COALESCE(EXCLUDED.effects_score,  user_detailed_ratings.effects_score),
       script_score   = COALESCE(EXCLUDED.script_score,   user_detailed_ratings.script_score),
       music_score    = COALESCE(EXCLUDED.music_score,    user_detailed_ratings.music_score),
       acting_score   = COALESCE(EXCLUDED.acting_score,   user_detailed_ratings.acting_score),
       updated_at = NOW()
     RETURNING overall_rating, director_score, effects_score, script_score, music_score, acting_score`,
    [
      userId, input.tmdb_id,
      input.overall_rating ?? null, input.director_score ?? null,
      input.effects_score  ?? null, input.script_score   ?? null,
      input.music_score    ?? null, input.acting_score   ?? null,
    ]
  );
  return result.rows[0];
};


export const getMood = async (userId: number, tmdbId: number): Promise<MoodType | null> => {
  const result = await pool.query(
    `SELECT mood FROM user_movie_moods WHERE user_id = $1 AND tmdb_id = $2`,
    [userId, tmdbId]
  );
  return result.rows[0]?.mood ?? null;
};

export const upsertMood = async (userId: number, input: MoodInput): Promise<MoodType> => {
  const result = await pool.query(
    `INSERT INTO user_movie_moods (user_id, tmdb_id, mood) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, tmdb_id) DO UPDATE SET mood = EXCLUDED.mood
     RETURNING mood`,
    [userId, input.tmdb_id, input.mood]
  );
  return result.rows[0].mood;
};


export const getComments = async (
  userId: number, tmdbId: number, page = 1
): Promise<CommentResponse[]> => {
  const offset = (page - 1) * 20;
  const result = await pool.query(
    `SELECT
       c.id, c.user_id,
       CASE WHEN c.is_anonymous THEN NULL ELSE u.username END AS username,
       CASE WHEN c.is_anonymous THEN NULL ELSE u.profile_image_url END AS profile_image_url,
       c.comment_text, c.is_anonymous, c.has_spoiler,
       c.likes_count, c.dislikes_count, c.is_edited,
       c.created_at, c.updated_at,
       cl.is_like AS my_reaction
     FROM comments c
     JOIN users u ON u.id = c.user_id
     LEFT JOIN comment_likes cl ON cl.comment_id = c.id AND cl.user_id = $1
     WHERE c.tmdb_id = $2
     ORDER BY c.created_at DESC
     LIMIT 20 OFFSET $3`,
    [userId, tmdbId, offset]
  );
  return result.rows.map(r => ({
    ...r,
    my_reaction: r.my_reaction === true ? 'like' : r.my_reaction === false ? 'dislike' : null,
  }));
};

export const createComment = async (
  userId: number, input: CommentInput
): Promise<CommentResponse> => {
  const result = await pool.query(
    `INSERT INTO comments (user_id, tmdb_id, comment_text, is_anonymous, has_spoiler)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, comment_text, is_anonymous, has_spoiler,
               likes_count, dislikes_count, is_edited, created_at, updated_at`,
    [userId, input.tmdb_id, input.comment_text.trim(),
      input.is_anonymous ?? false, input.has_spoiler ?? false]
  );
  const c = result.rows[0];
  let username = null, profile_image_url = null;
  if (!c.is_anonymous) {
    const user = await pool.query(
      'SELECT username, profile_image_url FROM users WHERE id = $1', [userId]
    );
    username = user.rows[0]?.username ?? null;
    profile_image_url = user.rows[0]?.profile_image_url ?? null;
  }
  return { ...c, username, profile_image_url, my_reaction: null };
};

export const updateComment = async (
  userId: number, commentId: number, commentText: string
): Promise<CommentResponse | null> => {
  const result = await pool.query(
    `UPDATE comments SET comment_text = $1, is_edited = TRUE, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING id, user_id, comment_text, is_anonymous, has_spoiler,
               likes_count, dislikes_count, is_edited, created_at, updated_at`,
    [commentText.trim(), commentId, userId]
  );
  if (result.rows.length === 0) return null;
  const c = result.rows[0];
  let username = null, profile_image_url = null;
  if (!c.is_anonymous) {
    const user = await pool.query(
      'SELECT username, profile_image_url FROM users WHERE id = $1', [userId]
    );
    username = user.rows[0]?.username ?? null;
    profile_image_url = user.rows[0]?.profile_image_url ?? null;
  }
  return { ...c, username, profile_image_url, my_reaction: null };
};

export const deleteComment = async (userId: number, commentId: number): Promise<boolean> => {
  const result = await pool.query(
    `DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id`,
    [commentId, userId]
  );
  return result.rows.length > 0;
};

export const toggleCommentLike = async (
  userId: number, commentId: number, isLike: boolean
): Promise<{ likes_count: number; dislikes_count: number; my_reaction: 'like' | 'dislike' | null }> => {
  const existing = await pool.query(
    `SELECT is_like FROM comment_likes WHERE user_id = $1 AND comment_id = $2`,
    [userId, commentId]
  );
  if (existing.rows.length > 0 && existing.rows[0].is_like === isLike) {
    await pool.query(
      `DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2`, [userId, commentId]
    );
  } else {
    await pool.query(
      `INSERT INTO comment_likes (user_id, comment_id, is_like) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, comment_id) DO UPDATE SET is_like = $3`,
      [userId, commentId, isLike]
    );
  }
  const counts = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE is_like = TRUE)  AS likes_count,
       COUNT(*) FILTER (WHERE is_like = FALSE) AS dislikes_count
     FROM comment_likes WHERE comment_id = $1`,
    [commentId]
  );
  await pool.query(
    `UPDATE comments SET likes_count = $1, dislikes_count = $2 WHERE id = $3`,
    [counts.rows[0].likes_count, counts.rows[0].dislikes_count, commentId]
  );
  const reaction = await pool.query(
    `SELECT is_like FROM comment_likes WHERE user_id = $1 AND comment_id = $2`,
    [userId, commentId]
  );
  const my_reaction = reaction.rows.length === 0 ? null : reaction.rows[0].is_like ? 'like' : 'dislike';
  return {
    likes_count: Number(counts.rows[0].likes_count),
    dislikes_count: Number(counts.rows[0].dislikes_count),
    my_reaction,
  };
};


export const getBestActorVote = async (
  userId: number, tmdbId: number
): Promise<{ actor_tmdb_id: number; actor_name: string } | null> => {
  const result = await pool.query(
    `SELECT actor_tmdb_id, actor_name FROM user_best_actor_votes
     WHERE user_id = $1 AND tmdb_id = $2`,
    [userId, tmdbId]
  );
  return result.rows[0] ?? null;
};

export const upsertBestActorVote = async (
  userId: number, input: BestActorVoteInput
): Promise<{ actor_tmdb_id: number; actor_name: string }> => {
  const result = await pool.query(
    `INSERT INTO user_best_actor_votes (user_id, tmdb_id, actor_tmdb_id, actor_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, tmdb_id) DO UPDATE
       SET actor_tmdb_id = EXCLUDED.actor_tmdb_id, actor_name = EXCLUDED.actor_name
     RETURNING actor_tmdb_id, actor_name`,
    [userId, input.tmdb_id, input.actor_tmdb_id, input.actor_name]
  );
  return result.rows[0];
};


export const resetAllRatings = async (userId: number, tmdbId: number): Promise<void> => {
  await pool.query(
    `DELETE FROM user_detailed_ratings WHERE user_id = $1 AND tmdb_id = $2`,
    [userId, tmdbId]
  );
  await pool.query(
    `DELETE FROM user_movie_moods WHERE user_id = $1 AND tmdb_id = $2`,
    [userId, tmdbId]
  );
  await pool.query(
    `DELETE FROM user_best_actor_votes WHERE user_id = $1 AND tmdb_id = $2`,
    [userId, tmdbId]
  );
};