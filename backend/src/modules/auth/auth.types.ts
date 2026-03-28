import { User } from '../shared/user.types';

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