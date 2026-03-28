import { User, UserList } from '../shared/user.types';

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