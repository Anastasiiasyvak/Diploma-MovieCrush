import { MediaType } from './tmdb.types';

export interface PersonalizedItem {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  release_date: string;
  category?: 'strong_match' | 'diversity' | 'hidden_gem';
}

export interface PersonalizedResponse {
  recommendations: PersonalizedItem[];
  strategy: 'personalized';
  watched_count: number;
  cached: boolean;
  computed_at: string;
  model_used: string;
}

export interface ColdStartItem {
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  release_date: string;
}

export interface ColdStartResponse {
  recommendations: ColdStartItem[];
  strategy: 'cold_start';
  watched_count: number;
}

export type MainRecsResponse = PersonalizedResponse | ColdStartResponse;