import api from './api';

export interface PersonalizedItem {
  tmdb_id: number;
  media_type: 'movie' | 'tv';
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

export type MainRecsResponse = PersonalizedResponse | ColdStartResponse;

export const isColdStart = (r: MainRecsResponse): r is ColdStartResponse =>
  (r as ColdStartResponse).strategy === 'cold_start';

export const isPersonalized = (r: MainRecsResponse): r is PersonalizedResponse =>
  (r as PersonalizedResponse).strategy === 'personalized';

export const recommendationsService = {
  getMain: async (seed = 0): Promise<MainRecsResponse> => {
    const response = await api.get<MainRecsResponse>('/recommendations', { params: { seed } });
    return response.data;
  },
};