import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { fetchWatchedEpisodes, toggleEpisode } from './episode.controller';
import {
  getActions, toggleAction,
  fetchListItems, getLists, addToList, removeFromList,
  getMyRating, saveRating,
  getMyMood, saveMood,
  fetchComments, postComment, editComment, removeComment, reactToComment,
  getMyBestActor, voteBestActor,
  resetMyRatings,
} from './movie.controller';

const router = Router();
router.use(authMiddleware);

// Actions
router.get('/movies/:tmdbId/actions', getActions);
router.post('/movies/actions', toggleAction);

// Lists
router.get('/movies/my-lists', getLists);
router.get('/movies/lists/:listId/items', fetchListItems);
router.post('/movies/lists/add', addToList);
router.delete('/movies/lists/:listId/items/:tmdbId', removeFromList);

// Ratings
router.get('/movies/:tmdbId/rating', getMyRating);
router.post('/movies/rating', saveRating);

// Moods
router.get('/movies/:tmdbId/mood', getMyMood);
router.post('/movies/mood', saveMood);

// Comments
router.get('/movies/:tmdbId/comments', fetchComments);
router.post('/movies/comments', postComment);
router.patch('/movies/comments/:commentId', editComment);
router.delete('/movies/comments/:commentId', removeComment);
router.post('/movies/comments/:commentId/react', reactToComment);

// Best actor
router.get('/movies/:tmdbId/best-actor', getMyBestActor);
router.post('/movies/best-actor', voteBestActor);

router.delete('/movies/:tmdbId/my-ratings', resetMyRatings);

router.get('/series/:seriesTmdbId/watched-episodes', fetchWatchedEpisodes);
router.post('/series/episode/toggle', toggleEpisode);

export default router;