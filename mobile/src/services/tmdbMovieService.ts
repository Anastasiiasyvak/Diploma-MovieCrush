import { TMDB_API_KEY, TMDB_BASE_URL } from '../constants/tmdb';
import {
  MovieDetails, MovieCredits, MovieImagesResponse,
  MovieVideosResponse, SimilarMovie,
} from '../types/movie.types';

interface TMDBResponse<T> {
  results: T[];
}

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

export const tmdbMovieService = {
  getMovieDetails: (movieId: number) =>
    fetchTMDB<MovieDetails>(`/movie/${movieId}`),

  getMovieCredits: (movieId: number) =>
    fetchTMDB<MovieCredits>(`/movie/${movieId}/credits`),

  getMovieImages: (movieId: number) =>
    fetchTMDB<MovieImagesResponse>(`/movie/${movieId}/images`, {
      include_image_language: 'en,null',
    }),

  getMovieVideos: (movieId: number) =>
    fetchTMDB<MovieVideosResponse>(`/movie/${movieId}/videos`),

  getSimilarMovies: (movieId: number) =>
    fetchTMDB<TMDBResponse<SimilarMovie>>(`/movie/${movieId}/similar`),

  getRecommendations: (movieId: number) =>
    fetchTMDB<TMDBResponse<SimilarMovie>>(`/movie/${movieId}/recommendations`),

  getExternalIds: (movieId: number) =>
    fetchTMDB<{ imdb_id: string | null }>(`/movie/${movieId}/external_ids`),
};