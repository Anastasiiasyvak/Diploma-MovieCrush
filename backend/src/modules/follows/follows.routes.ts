import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import * as ctrl from './follows.controller';

const router = Router();
router.use(authMiddleware);

router.post('/follow', ctrl.follow);
router.post('/unfollow', ctrl.unfollow);

router.get('/search', ctrl.search);

router.get('/me/counts', ctrl.getMyFollowCounts);
router.get('/me/followers', ctrl.getMyFollowers);
router.get('/me/following', ctrl.getMyFollowing);
router.get('/me/friends', ctrl.getMyFriends);

router.get('/user/:userId', ctrl.getUserProfile);
router.get('/user/:userId/status', ctrl.getStatus);
router.get('/user/:userId/followers', ctrl.getUserFollowers);
router.get('/user/:userId/following', ctrl.getUserFollowing);
router.get('/user/:userId/friends', ctrl.getUserFriends);

router.get('/user/:userId/lists', ctrl.getLists);
router.get('/user/:userId/lists/:listId', ctrl.getListItems);
router.get('/ratings/:tmdbId', ctrl.getRatings);

export default router;