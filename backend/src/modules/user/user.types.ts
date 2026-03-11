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
  soulmate_consent: boolean;
  subscription_type: string;
  account_status: string;
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