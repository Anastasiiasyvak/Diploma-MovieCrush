import { fetchTMDB } from './tmdbClient';
import {
  MovieDetails, MovieCredits, MovieImagesResponse,
  MovieVideosResponse, SimilarMovie,
} from '../types/movie.types';
import { TMDBResponse } from '../types/tmdb.types';


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
};