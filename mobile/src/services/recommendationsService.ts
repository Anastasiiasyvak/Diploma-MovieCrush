import api from './api';

export interface AiRecommendation {
  title: string;
  year: number;
  category: 'strong_match' | 'diversity' | 'hidden_gem';
  reasoning: string;
  why_this_will_work: string;
  tmdb_id: number;
  media_type: 'movie';
  poster_path: string | null;
  vote_average: number;
  overview: string;
}

export interface AiRecommendationsResponse {
  recommendations: AiRecommendation[];
  model_used: string;
  watched_count: number;
  cached: boolean;
  computed_at: string;
}

export const recommendationsService = {
  getAi: async (): Promise<AiRecommendationsResponse> => {
    const response = await api.get<AiRecommendationsResponse>('/recommendations/ai');
    return response.data;
  },

  refreshAi: async (): Promise<AiRecommendationsResponse> => {
    const response = await api.post<AiRecommendationsResponse>(
      '/recommendations/ai/refresh'
    );
    return response.data;
  },
};