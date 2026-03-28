import api from './api';
import { UserProfile } from './profileService';

export const settingsService = {
  updateUsername: async (username: string): Promise<{ user: UserProfile }> => {
    const r = await api.patch('/settings/username', { username });
    return r.data;
  },

  updateName: async (first_name: string | null, last_name: string | null): Promise<{ user: UserProfile }> => {
    const r = await api.patch('/settings/name', { first_name, last_name });
    return r.data;
  },

  changePassword: async (current_password: string, new_password: string): Promise<void> => {
    await api.patch('/settings/password', { current_password, new_password });
  },

  updateSocials: async (
    instagram_username?: string,
    telegram_username?: string
  ): Promise<{ user: UserProfile }> => {
    const r = await api.patch('/settings/socials', { instagram_username, telegram_username });
    return r.data;
  },

  updateSoulmate: async (soulmate_consent: boolean): Promise<void> => {
    await api.patch('/settings/soulmate', { soulmate_consent });
  },

  updateLanguage: async (language: 'en' | 'uk'): Promise<void> => {
    await api.patch('/settings/language', { language });
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('/settings/account');
  },
};