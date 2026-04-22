import api from './api';
import {
  MovieDetails, MovieCredits, MovieImagesResponse,
  MovieVideosResponse, SimilarMovie,
} from '../types/movie.types';

interface TMDBResponse<T> {
  results: T[];
}

const fetchTMDB = async <T>(
  endpoint: string,
  params?: Record<string, string | number>,
): Promise<T> => {
  const response = await api.get<T>(`/tmdb${endpoint}`, { params });
  return response.data;
};

export const tmdbMovieService = {
  getMovieDetails: (movieId: number) =>
    fetchTMDB<MovieDetails>(`/movie/${movieId}`),

  getMovieCredits: (movieId: number) =>
    fetchTMDB<MovieCredits>(`/movie/${movieId}/credits`),

  getMovieImages: (movieId: number) =>
    fetchTMDB<MovieImagesResponse>(`/movie/${movieId}/images`),

  getMovieVideos: (movieId: number) =>
    fetchTMDB<MovieVideosResponse>(`/movie/${movieId}/videos`),

  getSimilarMovies: (movieId: number) =>
    fetchTMDB<TMDBResponse<SimilarMovie>>(`/movie/${movieId}/similar`),

  getRecommendations: (movieId: number) =>
    fetchTMDB<TMDBResponse<SimilarMovie>>(`/movie/${movieId}/recommendations`),

  getExternalIds: (movieId: number) =>
    fetchTMDB<{ imdb_id: string | null }>(`/movie/${movieId}/external_ids`),
};