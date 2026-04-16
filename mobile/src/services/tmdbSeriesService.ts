import { TMDB_API_KEY, TMDB_BASE_URL } from '../constants/tmdb';
import {
  SeriesDetails, SeriesCredits, SeriesImagesResponse,
  SeriesVideosResponse, SimilarSeries, SeriesSeasonDetail,
} from '../types/series.types';

interface TMDBListResponse<T> { results: T[] }

const fetchTMDB = async <T>(
  endpoint: string,
  params?: Record<string, string>,
): Promise<T> => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
};

export const tmdbSeriesService = {
  getSeriesDetails: (seriesId: number) =>
    fetchTMDB<SeriesDetails>(`/tv/${seriesId}`),

  getSeriesCredits: (seriesId: number) =>
    fetchTMDB<SeriesCredits>(`/tv/${seriesId}/credits`),

  getSeriesImages: (seriesId: number) =>
    fetchTMDB<SeriesImagesResponse>(`/tv/${seriesId}/images`, {
      include_image_language: 'en,null',
    }),

  getSeriesVideos: (seriesId: number) =>
    fetchTMDB<SeriesVideosResponse>(`/tv/${seriesId}/videos`),

  getSimilarSeries: (seriesId: number) =>
    fetchTMDB<TMDBListResponse<SimilarSeries>>(`/tv/${seriesId}/similar`),

  getSeasonDetail: (seriesId: number, seasonNumber: number) =>
    fetchTMDB<SeriesSeasonDetail>(`/tv/${seriesId}/season/${seasonNumber}`),
};