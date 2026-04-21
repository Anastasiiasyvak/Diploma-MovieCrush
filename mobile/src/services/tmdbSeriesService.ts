import api from './api';
import {
  SeriesDetails, SeriesCredits, SeriesImagesResponse,
  SeriesVideosResponse, SimilarSeries, SeriesSeasonDetail,
  SeriesEpisode,
} from '../types/series.types';

interface TMDBListResponse<T> { results: T[] }

const fetchTMDB = async <T>(
  endpoint: string,
  params?: Record<string, string | number>,
): Promise<T> => {
  const response = await api.get<T>(`/tmdb${endpoint}`, { params });
  return response.data;
};

export const tmdbSeriesService = {
  getSeriesDetails: (seriesId: number) =>
    fetchTMDB<SeriesDetails>(`/tv/${seriesId}`),

  getSeriesCredits: (seriesId: number) =>
    fetchTMDB<SeriesCredits>(`/tv/${seriesId}/credits`),

  getSeriesImages: (seriesId: number) =>
    fetchTMDB<SeriesImagesResponse>(`/tv/${seriesId}/images`),

  getSeriesVideos: (seriesId: number) =>
    fetchTMDB<SeriesVideosResponse>(`/tv/${seriesId}/videos`),

  getSimilarSeries: (seriesId: number) =>
    fetchTMDB<TMDBListResponse<SimilarSeries>>(`/tv/${seriesId}/similar`),

  getSeasonDetail: (seriesId: number, seasonNumber: number) =>
    fetchTMDB<SeriesSeasonDetail>(`/tv/${seriesId}/season/${seasonNumber}`),

  getEpisodeDetail: (seriesId: number, seasonNumber: number, episodeNumber: number) =>
    fetchTMDB<SeriesEpisode>(
      `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`,
    ),
};