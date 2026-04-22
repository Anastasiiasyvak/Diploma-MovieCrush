export type MoodType =
  | 'happy' | 'inspired' | 'scared' | 'sad'
  | 'thoughtful' | 'bored' | 'excited'
  | 'romantic' | 'angry' | 'relaxed';

export interface MovieActionsResponse {
  is_favorite: boolean;
  is_watchlist: boolean;
  is_watched: boolean;
  is_disliked: boolean;
}

export interface ToggleActionInput {
  tmdb_id: number;
  action: 'favorite' | 'watchlist' | 'watched' | 'dislike';
  media_type: 'movie' | 'tv';
}

export interface AddToListInput {
  tmdb_id: number;
  list_id: number;
  media_type: 'movie' | 'tv';
}

export interface DetailedRatingInput {
  tmdb_id: number;
  overall_rating?: number;
  director_score?: number;
  effects_score?: number;
  script_score?: number;
  music_score?: number;
  acting_score?: number;
}

export interface DetailedRatingResponse {
  overall_rating: number | null;
  director_score: number | null;
  effects_score: number | null;
  script_score: number | null;
  music_score: number | null;
  acting_score: number | null;
}

export interface MoodInput {
  tmdb_id: number;
  mood: MoodType;
}

export interface CommentInput {
  tmdb_id: number;
  comment_text: string;
  is_anonymous?: boolean;
  has_spoiler?: boolean;
}

export interface CommentResponse {
  id: number;
  user_id: number;
  username: string | null;
  profile_image_url: string | null;
  comment_text: string;
  is_anonymous: boolean;
  has_spoiler: boolean;
  likes_count: number;
  dislikes_count: number;
  is_edited: boolean;
  my_reaction: 'like' | 'dislike' | null;
  created_at: Date;
  updated_at: Date;
}

export interface BestActorVoteInput {
  tmdb_id: number;
  actor_tmdb_id: number;
  actor_name: string;
}