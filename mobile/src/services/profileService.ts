import api from './api';

export interface UserProfile {
  id: number;
  uuid: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  instagram_username?: string;
  telegram_username?: string;
  friends_count: number;
  followers_count: number;
  following_count: number;
  movies_watched: number;
  series_watched: number;
  episodes_watched: number;
  custom_lists_count: number;
  subscription_type: string;
  created_at: string;
}

export interface UserList {
  id: number;
  user_id: number;
  list_type: 'favorites' | 'watched' | 'watchlist' | 'custom';
  name: string;
  is_private: boolean;
  created_at: string;
}

export interface ProfileData {
  user: UserProfile;
  lists: UserList[];
}

export const profileService = {
  getMyProfile: async (): Promise<ProfileData> => {
    const response = await api.get('/profile/me');
    return response.data;
  },

  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    instagram_username?: string;
    telegram_username?: string;
  }): Promise<{ user: UserProfile }> => {
    const response = await api.patch('/profile/me', data);
    return response.data;
  },

  createCustomList: async (name: string, isPrivate: boolean): Promise<{ list: UserList }> => {
    const response = await api.post('/profile/lists', { name, is_private: isPrivate });
    return response.data;
  },

  deleteCustomList: async (listId: number): Promise<void> => {
    await api.delete(`/profile/lists/${listId}`);
  },

  toggleListPrivacy: async (listId: number, isPrivate: boolean): Promise<{ list: UserList }> => {
    const response = await api.patch(`/profile/lists/${listId}`, { is_private: isPrivate });
    return response.data;
  },
};