import api from './api';

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
  media_type: 'movie' | 'tv';
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

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

export const onboardingService = {
  getContent: async (batch = 1): Promise<OnboardingContent> => {
    const { data } = await api.get<OnboardingContent>('/onboarding/content', {
      params: { batch },
    });
    return data;
  },

  checkStatus: async (): Promise<{ completed: boolean }> => {
    const { data } = await api.get<{ completed: boolean }>('/onboarding/status');
    return data;
  },

  complete: async (payload: CompleteOnboardingPayload): Promise<void> => {
    await api.post('/onboarding/complete', payload);
  },

  getActorPhotoUrl: (photoPath: string) => `${TMDB_IMAGE_BASE}${photoPath}`,
  getMoviePosterUrl: (posterPath: string) => `${TMDB_IMAGE_BASE}${posterPath}`,
};