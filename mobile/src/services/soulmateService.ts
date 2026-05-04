import api from './api';

export interface SoulmateBreakdown {
  rating: number;
  genre: number;
  actor: number;
  mood: number;
  director: number;
  disliked: number;
}

export interface SoulmateMatch {
  matched_user: {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  };
  similarity_score: number;
  similarity_percent: number;
  breakdown: SoulmateBreakdown;

  shared_movies_count: number;
  top_shared_movies: number[];
  shared_genres: string[];
  shared_disliked: number[];

  wrapped_year: number;
  computed_at: string;
}

export const soulmateService = {
  getMyMatch: async (): Promise<SoulmateMatch | null> => {
    try {
      const res = await api.get<SoulmateMatch>('/soulmate/me');
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  recompute: async (): Promise<SoulmateMatch | null> => {
    const res = await api.post<{ match: SoulmateMatch | null }>('/soulmate/recompute');
    return res.data.match;
  },
};