import { UserList } from './movie.types';

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
  soulmate_consent: boolean;
  language: string;
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

export interface ProfileData {
  user: UserProfile;
  lists: UserList[];
}