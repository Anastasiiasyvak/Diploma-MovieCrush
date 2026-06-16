import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  getMovieActions, toggleMovieAction,
  getListItems, addToCustomList, removeFromCustomList, getUserCustomLists,
  getRating, upsertRating,
  getMood, upsertMood,
  getComments, createComment, updateComment, deleteComment, toggleCommentLike,
  getBestActorVote, upsertBestActorVote,
  resetAllRatings,
} from './movie.service';
import { fireAndCacheMedia } from '../tmdb_cache/tmdb_cache.service';
import logger from '../../config/logger';

export const getActions = async (req: AuthRequest, res: Response) => {
  try {
    const tmdbId = parseInt(req.params['tmdbId'] as string, 10);
    if (isNaN(tmdbId)) { res.status(400).json({ error: 'Invalid tmdb_id' }); return; }
    const data = await getMovieActions(req.userId!, tmdbId);
    res.json(data);
  } catch (err) {
    logger.error({ err }, 'getActions failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleAction = async (req: AuthRequest, res: Response) => {
  try {
    const { tmdb_id, action, media_type } = req.body;
    if (!tmdb_id || !action) { res.status(400).json({ error: 'tmdb_id and action required' }); return; }
    const finalMediaType = media_type ?? 'movie';
    const data = await toggleMovieAction(req.userId!, { tmdb_id, action, media_type: finalMediaType });
    
    fireAndCacheMedia(tmdb_id, finalMediaType);


    res.json(data);
  } catch (err) {
    logger.error({ err }, 'toggleAction failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const fetchListItems = async (req: AuthRequest, res: Response) => {
  try {
    const listId = parseInt(req.params['listId'] as string, 10);
    if (isNaN(listId)) { res.status(400).json({ error: 'Invalid list_id' }); return; }
    const items = await getListItems(req.userId!, listId);
    res.json({ items });
  } catch (err: any) {
    if (err.message === 'List not found or not yours') { res.status(404).json({ error: err.message }); return; }
    logger.error({ err }, 'fetchListItems failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLists = async (req: AuthRequest, res: Response) => {
  try {
    const lists = await getUserCustomLists(req.userId!);
    res.json({ lists });
  } catch (err) {
    logger.error({ err }, 'getLists failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addToList = async (req: AuthRequest, res: Response) => {
  try {
    const { list_id, tmdb_id, media_type } = req.body;
    if (!list_id || !tmdb_id) { res.status(400).json({ error: 'list_id and tmdb_id required' }); return; }
    const finalMediaType = media_type ?? 'movie';
    await addToCustomList(req.userId!, { list_id, tmdb_id, media_type: finalMediaType });

    fireAndCacheMedia(tmdb_id, finalMediaType);


    res.status(201).json({ message: 'Added to list' });
  } catch (err: any) {
    if (err.message === 'List not found or not yours') { res.status(404).json({ error: err.message }); return; }
    logger.error({ err }, 'addToList failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeFromList = async (req: AuthRequest, res: Response) => {
  try {
    const listId = parseInt(req.params['listId'] as string, 10);
    const tmdbId = parseInt(req.params['tmdbId'] as string, 10);
    if (isNaN(listId) || isNaN(tmdbId)) { res.status(400).json({ error: 'Invalid IDs' }); return; }

    const { list_type } = await removeFromCustomList(req.userId!, listId, tmdbId);
    const actions = await getMovieActions(req.userId!, tmdbId);

    res.json({ message: 'Removed from list', list_type, actions });
  } catch (err: any) {
    if (err.message === 'List not found or not yours') { res.status(404).json({ error: err.message }); return; }
    logger.error({ err }, 'removeFromList failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyRating = async (req: AuthRequest, res: Response) => {
  try {
    const tmdbId = parseInt(req.params['tmdbId'] as string, 10);
    if (isNaN(tmdbId)) { res.status(400).json({ error: 'Invalid tmdb_id' }); return; }
    const data = await getRating(req.userId!, tmdbId);
    res.json(data);
  } catch (err) {
    logger.error({ err }, 'getMyRating failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const saveRating = async (req: AuthRequest, res: Response) => {
  try {
    const { tmdb_id, overall_rating, director_score, effects_score, script_score, music_score, acting_score, media_type, is_episode } = req.body;
    if (!tmdb_id) { res.status(400).json({ error: 'tmdb_id required' }); return; }
    const data = await upsertRating(req.userId!, {
      tmdb_id, overall_rating, director_score, effects_score, script_score, music_score, acting_score, is_episode,
    });

    if (!is_episode) {
      fireAndCacheMedia(tmdb_id, media_type ?? 'movie');
    }

    res.json(data);
  } catch (err) {
    logger.error({ err }, 'saveRating failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyMood = async (req: AuthRequest, res: Response) => {
  try {
    const tmdbId = parseInt(req.params['tmdbId'] as string, 10);
    if (isNaN(tmdbId)) { res.status(400).json({ error: 'Invalid tmdb_id' }); return; }
    const mood = await getMood(req.userId!, tmdbId);
    res.json({ mood });
  } catch (err) {
    logger.error({ err }, 'getMyMood failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const saveMood = async (req: AuthRequest, res: Response) => {
  try {
    const { tmdb_id, mood, media_type } = req.body;
    if (!tmdb_id || !mood) { res.status(400).json({ error: 'tmdb_id and mood required' }); return; }
    const saved = await upsertMood(req.userId!, { tmdb_id, mood });

    fireAndCacheMedia(tmdb_id, media_type ?? 'movie');

    res.json({ mood: saved });
  } catch (err) {
    logger.error({ err }, 'saveMood failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const fetchComments = async (req: AuthRequest, res: Response) => {
  try {
    const tmdbId = parseInt(req.params['tmdbId'] as string, 10);
    const page   = parseInt((req.query['page'] as string) ?? '1', 10);
    if (isNaN(tmdbId)) { res.status(400).json({ error: 'Invalid tmdb_id' }); return; }
    const comments = await getComments(req.userId!, tmdbId, page);
    res.json({ comments });
  } catch (err) {
    logger.error({ err }, 'fetchComments failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const postComment = async (req: AuthRequest, res: Response) => {
  try {
    const { tmdb_id, comment_text, is_anonymous, has_spoiler } = req.body;
    if (!tmdb_id || !comment_text?.trim()) { res.status(400).json({ error: 'tmdb_id and comment_text required' }); return; }
    if (comment_text.trim().length > 500) { res.status(400).json({ error: 'Comment max 500 characters' }); return; }
    const comment = await createComment(req.userId!, { tmdb_id, comment_text, is_anonymous, has_spoiler });
    res.status(201).json({ comment });
  } catch (err) {
    logger.error({ err }, 'postComment failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const editComment = async (req: AuthRequest, res: Response) => {
  try {
    const commentId = parseInt(req.params['commentId'] as string, 10);
    const { comment_text } = req.body;
    if (isNaN(commentId) || !comment_text?.trim()) { res.status(400).json({ error: 'commentId and comment_text required' }); return; }
    if (comment_text.trim().length > 500) { res.status(400).json({ error: 'Comment max 500 characters' }); return; }
    const comment = await updateComment(req.userId!, commentId, comment_text);
    if (!comment) { res.status(404).json({ error: 'Comment not found or not yours' }); return; }
    res.json({ comment });
  } catch (err) {
    logger.error({ err }, 'editComment failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeComment = async (req: AuthRequest, res: Response) => {
  try {
    const commentId = parseInt(req.params['commentId'] as string, 10);
    if (isNaN(commentId)) { res.status(400).json({ error: 'Invalid commentId' }); return; }
    const deleted = await deleteComment(req.userId!, commentId);
    if (!deleted) { res.status(404).json({ error: 'Comment not found or not yours' }); return; }
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    logger.error({ err }, 'removeComment failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const reactToComment = async (req: AuthRequest, res: Response) => {
  try {
    const commentId = parseInt(req.params['commentId'] as string, 10);
    const { is_like } = req.body;
    if (isNaN(commentId) || typeof is_like !== 'boolean') { res.status(400).json({ error: 'commentId and is_like required' }); return; }
    const data = await toggleCommentLike(req.userId!, commentId, is_like);
    res.json(data);
  } catch (err) {
    logger.error({ err }, 'reactToComment failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyBestActor = async (req: AuthRequest, res: Response) => {
  try {
    const tmdbId = parseInt(req.params['tmdbId'] as string, 10);
    if (isNaN(tmdbId)) { res.status(400).json({ error: 'Invalid tmdb_id' }); return; }
    const data = await getBestActorVote(req.userId!, tmdbId);
    res.json(data ?? { actor_tmdb_id: null, actor_name: null });
  } catch (err) {
    logger.error({ err }, 'getMyBestActor failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const voteBestActor = async (req: AuthRequest, res: Response) => {
  try {
    const { tmdb_id, actor_tmdb_id, actor_name, media_type } = req.body;
    if (!tmdb_id || !actor_tmdb_id || !actor_name) { res.status(400).json({ error: 'tmdb_id, actor_tmdb_id and actor_name required' }); return; }
    const data = await upsertBestActorVote(req.userId!, { tmdb_id, actor_tmdb_id, actor_name });

    fireAndCacheMedia(tmdb_id, media_type ?? 'movie');


    res.json(data);
  } catch (err) {
    logger.error({ err }, 'voteBestActor failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetMyRatings = async (req: AuthRequest, res: Response) => {
  try {
    const tmdbId = parseInt(req.params['tmdbId'] as string, 10);
    if (isNaN(tmdbId)) { res.status(400).json({ error: 'Invalid tmdb_id' }); return; }
    await resetAllRatings(req.userId!, tmdbId);
    res.json({ message: 'Ratings reset' });
  } catch (err) {
    logger.error({ err }, 'resetMyRatings failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};