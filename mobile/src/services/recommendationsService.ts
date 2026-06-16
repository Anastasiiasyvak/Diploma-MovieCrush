import api from './api';
import {
  PersonalizedItem, PersonalizedResponse,
  ColdStartItem, ColdStartResponse, MainRecsResponse,
} from '../types/recommendations.types';

export type {
  PersonalizedItem, PersonalizedResponse,
  ColdStartItem, ColdStartResponse, MainRecsResponse,
};

export const isPersonalized = (r: MainRecsResponse): r is PersonalizedResponse =>
  (r as PersonalizedResponse).strategy === 'personalized';

export const recommendationsService = {
  getMain: async (seed = 0): Promise<MainRecsResponse> => {
    const response = await api.get<MainRecsResponse>('/recommendations', { params: { seed } });
    return response.data;
  },
};