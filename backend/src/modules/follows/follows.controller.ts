import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  followUser, unfollowUser,
  getFollowers, getFollowing, getFriends,
  getFollowStatus, getMyCounts, getPublicProfile,
  searchUsers, getUserLists, getUserListItems,
  getFollowingRatingsForMedia,
  FollowError, FOLLOW_ERROR_CODES,
} from './follows.service';
import logger from '../../config/logger';
import { parseTmdbId } from '../tmdb/tmdb.helpers';

const parseUserId = (raw: string): number | null => {
  const n = parseInt(raw, 10);
  return isNaN(n) ? null : n;
};

export const follow = async (req: AuthRequest, res: Response) => {
  try {
    const { user_id } = req.body;
    const targetId = parseUserId(String(user_id));
    if (!targetId) { res.status(400).json({ error: 'user_id required' }); return; }

    const counts = await followUser(req.userId!, targetId);
    res.json(counts);
  } catch (err: any) {
    if (err instanceof FollowError) {
      switch (err.code) {
        case FOLLOW_ERROR_CODES.SELF_FOLLOW:
          res.status(400).json({ error: err.message }); return;
        case FOLLOW_ERROR_CODES.USER_NOT_FOUND:
          res.status(404).json({ error: err.message }); return;
        default:
          res.status(400).json({ error: err.message }); return;
      }
    }
    logger.error({ err, userId: req.userId }, 'follow failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unfollow = async (req: AuthRequest, res: Response) => {
  try {
    const { user_id } = req.body;
    const targetId = parseUserId(String(user_id));
    if (!targetId) { res.status(400).json({ error: 'user_id required' }); return; }

    const counts = await unfollowUser(req.userId!, targetId);
    res.json(counts);
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'unfollow failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await getFollowers(req.userId!, req.userId!);
    res.json({ users });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'getMyFollowers failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const users = await getFollowing(req.userId!, req.userId!);
    res.json({ users });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'getMyFollowing failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyFriends = async (req: AuthRequest, res: Response) => {
  try {
    const users = await getFriends(req.userId!, req.userId!);
    res.json({ users });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'getMyFriends failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyFollowCounts = async (req: AuthRequest, res: Response) => {
  try {
    const counts = await getMyCounts(req.userId!);
    res.json(counts);
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'getMyFollowCounts failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = parseUserId(req.params['userId'] as string);
    if (!targetId) { res.status(400).json({ error: 'Invalid user id' }); return; }

    const users = await getFollowers(targetId, req.userId!);
    res.json({ users });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'getUserFollowers failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = parseUserId(req.params['userId'] as string);
    if (!targetId) { res.status(400).json({ error: 'Invalid user id' }); return; }

    const users = await getFollowing(targetId, req.userId!);
    res.json({ users });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'getUserFollowing failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserFriends = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = parseUserId(req.params['userId'] as string);
    if (!targetId) { res.status(400).json({ error: 'Invalid user id' }); return; }

    const users = await getFriends(targetId, req.userId!);
    res.json({ users });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'getUserFriends failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = parseUserId(req.params['userId'] as string);
    if (!targetId) { res.status(400).json({ error: 'Invalid user id' }); return; }

    const profile = await getPublicProfile(req.userId!, targetId);
    if (!profile) { res.status(404).json({ error: 'User not found' }); return; }

    res.json(profile);
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'getUserProfile failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getStatus = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = parseUserId(req.params['userId'] as string);
    if (!targetId) { res.status(400).json({ error: 'Invalid user id' }); return; }

    const status = await getFollowStatus(req.userId!, targetId);
    res.json(status);
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'getStatus failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const search = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query['q'] as string | undefined;
    if (!query || query.trim().length < 2) {
      res.json({ users: [] }); return;
    }
    const users = await searchUsers(req.userId!, query);
    res.json({ users });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'searchUsers failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLists = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = parseUserId(req.params['userId'] as string);
    if (!targetId) { res.status(400).json({ error: 'Invalid user id' }); return; }

    const lists = await getUserLists(targetId);
    res.json({ lists });
  } catch (err: any) {
    if (err instanceof FollowError && err.code === FOLLOW_ERROR_CODES.USER_NOT_FOUND) {
      res.status(404).json({ error: err.message }); return;
    }
    logger.error({ err, userId: req.userId }, 'getLists failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getListItems = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = parseUserId(req.params['userId'] as string);
    const listId   = parseUserId(req.params['listId'] as string);
    if (!targetId || !listId) { res.status(400).json({ error: 'Invalid IDs' }); return; }

    const items = await getUserListItems(targetId, listId);
    res.json({ items });
  } catch (err: any) {
    if (err instanceof FollowError && err.code === FOLLOW_ERROR_CODES.LIST_NOT_FOUND) {
      res.status(404).json({ error: err.message }); return;
    }
    logger.error({ err, userId: req.userId }, 'getListItems failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRatings = async (req: AuthRequest, res: Response) => {
  try {
    const tmdbId = parseTmdbId(req.params['tmdbId']);
    if (!tmdbId) { res.status(400).json({ error: 'Invalid tmdb id' }); return; }

    const ratings = await getFollowingRatingsForMedia(req.userId!, tmdbId);
    res.json({ ratings });
  } catch (err) {
    logger.error({ err, userId: req.userId }, 'getRatings failed');
    res.status(500).json({ error: 'Internal server error' });
  }
};