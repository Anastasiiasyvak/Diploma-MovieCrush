export interface User {
  id: number;
  uuid: string;
  email: string;
  password_hash: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_image_url?: string;
  language: string;
  instagram_username?: string;
  telegram_username?: string;
  soulmate_consent: boolean;
  subscription_type: string;
  account_status: string;
  friends_count: number;
  followers_count: number;
  following_count: number;
  movies_watched: number;
  series_watched: number;
  episodes_watched: number;
  custom_lists_count: number;
  created_at: Date;
}

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
  first_name?: string;
  last_name?: string;
  language?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
}

export interface UserList {
  id: number;
  user_id: number;
  list_type: 'favorites' | 'watched' | 'watchlist' | 'custom';
  name: string;
  is_private: boolean;
  created_at: Date;
}

export interface ProfileResponse {
  user: Omit<User, 'password_hash'>;
  lists: UserList[];
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  instagram_username?: string;
  telegram_username?: string;
  profile_image_url?: string;
}