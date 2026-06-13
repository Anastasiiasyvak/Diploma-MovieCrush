import api from './api';
import { UserProfile, ProfileData } from '../types/profile.types';
import { UserList } from '../types/movie.types';

export type { UserProfile, ProfileData, UserList };

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
    const response = await api.post('/lists', { name, is_private: isPrivate });
    return response.data;
  },

  deleteCustomList: async (listId: number): Promise<void> => {
    await api.delete(`/lists/${listId}`);
  },

  toggleListPrivacy: async (listId: number, isPrivate: boolean): Promise<{ list: UserList }> => {
    const response = await api.patch(`/lists/${listId}`, { is_private: isPrivate });
    return response.data;
  },
};