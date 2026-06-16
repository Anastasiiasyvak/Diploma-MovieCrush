import { MediaType } from './tmdb.types';

export interface OnboardingActor {
  id: number;
  tmdb_id: number;
  name: string;
  photo_path: string;
  known_for: string | null;
}

export interface OnboardingMovie {
  id: number;
  tmdb_id: number;
  title: string;
  poster_path: string;
  year: number;
  genre: string;
  batch: number;
  media_type: MediaType;
}

export interface OnboardingContent {
  actors: OnboardingActor[];
  movies: OnboardingMovie[];
}

export interface CompleteOnboardingPayload {
  liked_actor_ids: number[];
  watched_tmdb_ids: number[];
  ratings: Record<number, number>;
}