import { MediaType } from './tmdb.types';

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
  media_type: MediaType;
  added_at: string;
}

export interface FollowingRating {
  user_id: number;
  username: string;
  profile_image_url: string | null;
  overall_rating: number;
  rated_at: string;
}