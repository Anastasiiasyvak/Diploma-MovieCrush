export interface WatchedMovieForPrompt {
  title: string;
  rating: number | null;       
  is_favorite: boolean;
  is_disliked: boolean;
}

export interface AiRecommendationItem {
  title: string;
  year: number;
  category: 'strong_match' | 'diversity' | 'hidden_gem';
  reasoning: string;
  why_this_will_work: string;

  tmdb_id?: number;
  media_type?: 'movie';
  poster_path?: string | null;
  vote_average?: number;
  overview?: string;
}

export interface AiRecommendationsResponse {
  recommendations: AiRecommendationItem[];
  model_used: string;
  watched_count: number;
  cached: boolean;
  computed_at: string;
}

export interface GeminiRawResponse {
  recommendations: Array<{
    title: string;
    year: number;
    category: 'strong_match' | 'diversity' | 'hidden_gem';
    reasoning: string;
    why_this_will_work: string;
  }>;
}