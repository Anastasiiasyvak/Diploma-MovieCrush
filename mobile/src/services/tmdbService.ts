import { TMDB_API_KEY, TMDB_BASE_URL } from '../constants/tmdb';

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface TVSeries {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

const fetchTMDB = async <T>(endpoint: string, params?: Record<string, string>): Promise<T> => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
  return response.json();
};

export const tmdbService = {
  // Movies

  getTrendingMovies: (timeWindow: 'day' | 'week' = 'week') =>
    fetchTMDB<TMDBResponse<Movie>>(`/trending/movie/${timeWindow}`),

  getTopRatedMovies: (page = 1) =>
    fetchTMDB<TMDBResponse<Movie>>('/movie/top_rated', { page: String(page) }),

  getUpcomingMovies: (page = 1) =>
    fetchTMDB<TMDBResponse<Movie>>('/movie/upcoming', { page: String(page) }),

  getMovieDetails: (movieId: number) =>
    fetchTMDB<Movie>(`/movie/${movieId}`),

  searchMovies: (query: string, page = 1) =>
    fetchTMDB<TMDBResponse<Movie>>('/search/movie', { query, page: String(page) }),

  // TV Series 

  getTrendingSeries: (timeWindow: 'day' | 'week' = 'week') =>
    fetchTMDB<TMDBResponse<TVSeries>>(`/trending/tv/${timeWindow}`),

  getTopRatedSeries: (page = 1) =>
    fetchTMDB<TMDBResponse<TVSeries>>('/tv/top_rated', { page: String(page) }),

  getSeriesDetails: (seriesId: number) =>
    fetchTMDB<TVSeries>(`/tv/${seriesId}`),

  searchSeries: (query: string, page = 1) =>
    fetchTMDB<TMDBResponse<TVSeries>>('/search/tv', { query, page: String(page) }),
};