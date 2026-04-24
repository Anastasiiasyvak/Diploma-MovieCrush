import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  followUser, unfollowUser,
  getFollowers, getFollowing, getFriends,
  getFollowStatus, getMyCounts, getPublicProfile,
  searchUsers, getUserLists, getUserListItems,
} from './follows.service';

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
    if (err.message === 'Cannot follow yourself') {
      res.status(400).json({ error: err.message }); return;
    }
    if (err.message === 'User not found') {
      res.status(404).json({ error: err.message }); return;
    }
    console.error('follow error:', err);
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
    console.error('unfollow error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const users = await getFollowers(req.userId!, req.userId!);
    res.json({ users });
  } catch (err) {
    console.error('getMyFollowers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const users = await getFollowing(req.userId!, req.userId!);
    res.json({ users });
  } catch (err) {
    console.error('getMyFollowing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyFriends = async (req: AuthRequest, res: Response) => {
  try {
    const users = await getFriends(req.userId!, req.userId!);
    res.json({ users });
  } catch (err) {
    console.error('getMyFriends error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyFollowCounts = async (req: AuthRequest, res: Response) => {
  try {
    const counts = await getMyCounts(req.userId!);
    res.json(counts);
  } catch (err) {
    console.error('getMyFollowCounts error:', err);
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
    console.error('getUserFollowers error:', err);
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
    console.error('getUserFollowing error:', err);
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
    console.error('getUserFriends error:', err);
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
    console.error('getUserProfile error:', err);
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
    console.error('getStatus error:', err);
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
    console.error('search users error:', err);
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
    if (err.message === 'User not found') {
      res.status(404).json({ error: err.message }); return;
    }
    console.error('getLists error:', err);
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
    if (err.message === 'List not found or private') {
      res.status(404).json({ error: err.message }); return;
    }
    console.error('getListItems error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};