import api from './api';

export interface AiRecommendation {
  title: string;
  year: number;
  category: 'strong_match' | 'diversity' | 'hidden_gem';
  reasoning: string;
  why_this_will_work: string;
  tmdb_id: number;
  media_type: 'movie' | 'tv';
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

export interface ColdStartItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
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

export interface AlsItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
  release_date: string;
}

export interface AlsResponse {
  recommendations: AlsItem[];
  strategy: 'als';
  watched_count: number;
}

export type MainRecsResponse = AiRecommendationsResponse | ColdStartResponse | AlsResponse;

export const isColdStart = (r: MainRecsResponse): r is ColdStartResponse =>
  (r as ColdStartResponse).strategy === 'cold_start';

export const isAls = (r: MainRecsResponse): r is AlsResponse =>
  (r as AlsResponse).strategy === 'als';

export const recommendationsService = {
  getMain: async (seed = 0): Promise<MainRecsResponse> => {
    const response = await api.get<MainRecsResponse>('/recommendations', { params: { seed } });
    return response.data;
  },

  getAi: async (): Promise<AiRecommendationsResponse> => {
    const response = await api.get<AiRecommendationsResponse>('/recommendations/ai');
    return response.data;
  },

  refreshAi: async (): Promise<AiRecommendationsResponse> => {
    const response = await api.post<AiRecommendationsResponse>('/recommendations/ai/refresh');
    return response.data;
  },
};