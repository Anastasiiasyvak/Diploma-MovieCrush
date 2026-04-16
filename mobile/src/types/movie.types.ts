export type MoodType =
  | 'happy' | 'inspired' | 'scared' | 'sad'
  | 'thoughtful' | 'bored' | 'excited'
  | 'romantic' | 'angry' | 'relaxed';


export interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number | null;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { english_name: string }[];
  status: string;
  tagline: string | null;
  budget: number;
  revenue: number;
  imdb_id: string | null;
}

export interface MovieCredits {
  cast: MovieCastMember[];
  crew: MovieCrewMember[];
}

export interface MovieCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface MovieCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface MovieImage {
  file_path: string;
  width: number;
  height: number;
}

export interface MovieImagesResponse {
  backdrops: MovieImage[];
  posters: MovieImage[];
}

export interface MovieVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface MovieVideosResponse {
  results: MovieVideo[];
}

export interface SimilarMovie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
}

// далі все приходить з моєї бази даних, а не з TMDB

export interface MovieActions {
  is_favorite: boolean;
  is_watchlist: boolean;
  is_watched: boolean;
  is_disliked: boolean;
}

export interface DetailedRating {
  overall_rating: number | null;
  director_score: number | null;
  effects_score: number | null;
  script_score: number | null;
  music_score: number | null;
  acting_score: number | null;
}

export interface MovieComment {
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
  created_at: string;
  updated_at: string;
}

export interface UserList {
  id: number;
  name: string;
  list_type: string;
  is_private: boolean;
}