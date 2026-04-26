import api from './api';

export interface PublicUserProfile {
  id: number;
  uuid: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  friends_count: number;
  followers_count: number;
  following_count: number;
  movies_watched: number;
  series_watched: number;
  episodes_watched: number;
}

export interface UserListItem extends PublicUserProfile {
  is_followed_by_me: boolean;
}

export interface FollowStatus {
  is_following: boolean;
  is_followed_by: boolean;
  is_friend: boolean;
}

export interface FollowCounts {
  friends_count: number;
  followers_count: number;
  following_count: number;
}

export type UserProfileWithStatus = PublicUserProfile & FollowStatus & {
  telegram_username: string | null;
  instagram_username: string | null;
  created_at: string;
};

export interface PublicListSummary {
  id: number;
  list_type: 'watched' | 'favorites' | 'watchlist' | 'custom';
  name: string;
  is_private: boolean;
  items_count: number;
}

export interface ListItemRaw {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  added_at: string;
}

export interface FollowingRating {
  user_id: number;
  username: string;
  profile_image_url: string | null;
  overall_rating: number;     
  rated_at: string;
}

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