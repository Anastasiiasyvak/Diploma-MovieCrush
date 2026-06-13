import api from './api';

import { SoulmateBreakdown, SoulmateMatch } from '../types/soulmate.types';
export type { SoulmateBreakdown, SoulmateMatch };

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