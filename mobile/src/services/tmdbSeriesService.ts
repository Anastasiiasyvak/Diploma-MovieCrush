import { fetchTMDB } from './tmdbClient';
import {
  SeriesDetails, SeriesCredits, SeriesImagesResponse,
  SeriesVideosResponse, SimilarSeries, SeriesSeasonDetail,
  SeriesEpisode,
} from '../types/series.types';
import { TMDBResponse } from '../types/tmdb.types';

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
    fetchTMDB<TMDBResponse<SimilarSeries>>(`/tv/${seriesId}/similar`),

  getSeriesRecommendations: (seriesId: number) =>
    fetchTMDB<TMDBResponse<SimilarSeries>>(`/tv/${seriesId}/recommendations`),

  getSeasonDetail: (seriesId: number, seasonNumber: number) =>
    fetchTMDB<SeriesSeasonDetail>(`/tv/${seriesId}/season/${seasonNumber}`),

  getEpisodeDetail: (seriesId: number, seasonNumber: number, episodeNumber: number) =>
    fetchTMDB<SeriesEpisode>(
      `/tv/${seriesId}/season/${seasonNumber}/episode/${episodeNumber}`,
    ),
};