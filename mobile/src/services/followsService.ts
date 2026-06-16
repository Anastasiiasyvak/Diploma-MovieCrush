import { MediaType } from '../types/tmdb.types';
import api from './api';

import {
  PublicUserProfile, UserListItem, FollowStatus, FollowCounts,
  UserProfileWithStatus, PublicListSummary, ListItemRaw, FollowingRating,
} from '../types/follows.types';

export type {
  PublicUserProfile, UserListItem, FollowStatus, FollowCounts,
  UserProfileWithStatus, PublicListSummary, ListItemRaw, FollowingRating,
};

export const followsService = {
  follow: async (userId: number): Promise<FollowCounts> => {
    const res = await api.post<FollowCounts>('/follows/follow', { user_id: userId });
    return res.data;
  },

  unfollow: async (userId: number): Promise<FollowCounts> => {
    const res = await api.post<FollowCounts>('/follows/unfollow', { user_id: userId });
    return res.data;
  },

  searchUsers: async (query: string): Promise<UserListItem[]> => {
    const res = await api.get<{ users: UserListItem[] }>('/follows/search', {
      params: { q: query },
    });
    return res.data.users;
  },

  getMyCounts: async (): Promise<FollowCounts> => {
    const res = await api.get<FollowCounts>('/follows/me/counts');
    return res.data;
  },

  getMyFollowers: async (): Promise<UserListItem[]> => {
    const res = await api.get<{ users: UserListItem[] }>('/follows/me/followers');
    return res.data.users;
  },

  getMyFollowing: async (): Promise<UserListItem[]> => {
    const res = await api.get<{ users: UserListItem[] }>('/follows/me/following');
    return res.data.users;
  },

  getMyFriends: async (): Promise<UserListItem[]> => {
    const res = await api.get<{ users: UserListItem[] }>('/follows/me/friends');
    return res.data.users;
  },

  getUserProfile: async (userId: number): Promise<UserProfileWithStatus> => {
    const res = await api.get<UserProfileWithStatus>(`/follows/user/${userId}`);
    return res.data;
  },

  getFollowStatus: async (userId: number): Promise<FollowStatus> => {
    const res = await api.get<FollowStatus>(`/follows/user/${userId}/status`);
    return res.data;
  },

  getUserFollowers: async (userId: number): Promise<UserListItem[]> => {
    const res = await api.get<{ users: UserListItem[] }>(`/follows/user/${userId}/followers`);
    return res.data.users;
  },

  getUserFollowing: async (userId: number): Promise<UserListItem[]> => {
    const res = await api.get<{ users: UserListItem[] }>(`/follows/user/${userId}/following`);
    return res.data.users;
  },

  getUserFriends: async (userId: number): Promise<UserListItem[]> => {
    const res = await api.get<{ users: UserListItem[] }>(`/follows/user/${userId}/friends`);
    return res.data.users;
  },

  getUserLists: async (userId: number): Promise<PublicListSummary[]> => {
    const res = await api.get<{ lists: PublicListSummary[] }>(`/follows/user/${userId}/lists`);
    return res.data.lists;
  },

  getUserListItems: async (userId: number, listId: number): Promise<ListItemRaw[]> => {
    const res = await api.get<{ items: ListItemRaw[] }>(`/follows/user/${userId}/lists/${listId}`);
    return res.data.items;
  },

  getFollowingRatings: async (tmdbId: number): Promise<FollowingRating[]> => {
    const res = await api.get<{ ratings: FollowingRating[] }>(`/follows/ratings/${tmdbId}`);
    return res.data.ratings;
  },
};