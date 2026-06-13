import api from './api';

export const fetchTMDB = async <T>(
  endpoint: string,
  params?: Record<string, string | number>,
): Promise<T> => {
  const response = await api.get<T>(`/tmdb${endpoint}`, { params });
  return response.data;
};