import api from './api';
import {
  OnboardingActor, OnboardingMovie,
  OnboardingContent, CompleteOnboardingPayload,
} from '../types/onboarding.types';

export type {
  OnboardingActor, OnboardingMovie,
  OnboardingContent, CompleteOnboardingPayload,
};

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';

export const onboardingService = {
  getContent: async (batch = 1): Promise<OnboardingContent> => {
    const { data } = await api.get<OnboardingContent>('/onboarding/content', {
      params: { batch },
    });
    return data;
  },

  complete: async (payload: CompleteOnboardingPayload): Promise<void> => {
    await api.post('/onboarding/complete', payload);
  },

  getActorPhotoUrl: (photoPath: string) => `${TMDB_IMAGE_BASE}${photoPath}`,
  getMoviePosterUrl: (posterPath: string) => `${TMDB_IMAGE_BASE}${posterPath}`,
};