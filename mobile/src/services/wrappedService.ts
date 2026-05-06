import api from './api';
import { WrappedSummary } from '../types/wrapped.types';

export const wrappedService = {
  getMyWrapped: async (year?: number): Promise<WrappedSummary | null> => {
    try {
      const res = await api.get<WrappedSummary>('/wrapped/me', {
        params: year ? { year } : undefined,
      });
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  },

  recompute: async (): Promise<WrappedSummary | null> => {
    const res = await api.post<{ wrapped: WrappedSummary | null }>('/wrapped/recompute');
    return res.data.wrapped;
  },
};