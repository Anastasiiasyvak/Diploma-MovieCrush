import { TMDB_API_KEY, TMDB_BASE_URL } from '../constants/tmdb';
import {
  Movie, TVSeries, TMDBResponse, MediaItem, DiscoverFilters,
} from '../types/tmdb.types';

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

const shuffle = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const fetchRecommendations = async (
  filters: DiscoverFilters,
  seed = 0,
): Promise<MediaItem[]> => {
  const mt = filters.mediaType;
  const baseType: 'movie' | 'tv' =
    mt === 'movie' || mt === 'animation' ? 'movie' : 'tv';

  const buildParams = (page: number, langOverride?: string): Record<string, string> => {
    const p: Record<string, string> = {
      page: String(page),
      sort_by: filters.sortBy ?? 'popularity.desc',
      'vote_count.gte': '50',
    };

    if (filters.minRating) p['vote_average.gte'] = String(filters.minRating);
    if (filters.maxRating) p['vote_average.lte'] = String(filters.maxRating);

    const genreIds = [...(filters.genreIds ?? [])];

    if (mt === 'anime') {
      p['with_original_language'] = 'ja';
      if (!genreIds.includes(16)) genreIds.push(16);

    } else if (mt === 'animation') {
      if (!genreIds.includes(16)) genreIds.push(16);
      p['without_keywords']          = '210024';
      p['without_original_language'] = 'ja';

    } else if (mt === 'animated_series') {
      if (!genreIds.includes(16)) genreIds.push(16);
      p['without_keywords']          = '210024';
      p['without_original_language'] = 'ja';

    } else if (mt === 'dorama') {
      p['without_keywords'] = '210024';
      p['without_genres']   = '16';
      if (!genreIds.includes(18)) genreIds.push(18);
      if (!filters.originCountry && langOverride) {
        p['with_original_language'] = langOverride;
      }

    } else if (mt === 'movie') {
      p['without_genres']   = '16';     
      p['without_keywords'] = '210024'; 

    } else if (mt === 'tv') {
      p['without_genres']   = '16';     
      p['without_keywords'] = '210024';
    }

    if (genreIds.length) p['with_genres'] = genreIds.join(',');

    if (filters.originCountry) p['with_origin_country'] = filters.originCountry;
    if (filters.originalLanguage && mt !== 'anime' && mt !== 'dorama') {
      p['with_original_language'] = filters.originalLanguage;
    }

    if (baseType === 'movie') {
      if (filters.yearFrom) p['primary_release_date.gte'] = `${filters.yearFrom}-01-01`;
      if (filters.yearTo)   p['primary_release_date.lte'] = `${filters.yearTo}-12-31`;
    } else {
      if (filters.yearFrom) p['first_air_date.gte'] = `${filters.yearFrom}-01-01`;
      if (filters.yearTo)   p['first_air_date.lte'] = `${filters.yearTo}-12-31`;
    }

    return p;
  };

  const pages    = [1, 2, 3].map(p => p + seed * 3);
  const endpoint = `/discover/${baseType}`;

  const fetchJobs: Promise<TMDBResponse<Movie | TVSeries>>[] =
    mt === 'dorama' && !filters.originCountry
      ? pages.flatMap(page =>
          ['ko', 'ja', 'zh', 'th', 'vi'].map(lang =>
            fetchTMDB<TMDBResponse<Movie | TVSeries>>(endpoint, buildParams(page, lang))
              .catch(() => ({ page: 0, results: [], total_pages: 0, total_results: 0 }))
          )
        )
      : pages.map(page =>
          fetchTMDB<TMDBResponse<Movie | TVSeries>>(endpoint, buildParams(page))
            .catch(() => ({ page: 0, results: [], total_pages: 0, total_results: 0 }))
        );

  const settled = await Promise.allSettled(fetchJobs);

  const items: MediaItem[] = [];
  const seen = new Set<number>();

  for (const r of settled) {
    if (r.status === 'fulfilled') {
      for (const item of r.value.results) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          items.push({ ...item, mediaType: baseType });
        }
      }
    }
  }

  return shuffle(items).slice(0, 25);
};

export const tmdbService = {
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

  getTrendingSeries: (timeWindow: 'day' | 'week' = 'week') =>
    fetchTMDB<TMDBResponse<TVSeries>>(`/trending/tv/${timeWindow}`),

  getTopRatedSeries: (page = 1) =>
    fetchTMDB<TMDBResponse<TVSeries>>('/tv/top_rated', { page: String(page) }),

  getSeriesDetails: (seriesId: number) =>
    fetchTMDB<TVSeries>(`/tv/${seriesId}`),

  searchSeries: (query: string, page = 1) =>
    fetchTMDB<TMDBResponse<TVSeries>>('/search/tv', { query, page: String(page) }),
};

export type { Movie, TVSeries, TMDBResponse, MediaItem, DiscoverFilters };