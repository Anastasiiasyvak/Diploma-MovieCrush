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

export type MediaItem = (Movie | TVSeries) & { mediaType: 'movie' | 'tv' };

export type ContentType =
  | 'movie'
  | 'tv'
  | 'anime'
  | 'animation'
  | 'animated_series'
  | 'dorama';

export interface DiscoverFilters {
  mediaType: ContentType;
  genreIds?: number[];
  yearFrom?: number;
  yearTo?: number;
  originCountry?: string;
  originalLanguage?: string;
  minRating?: number;
  maxRating?: number;
  sortBy?: 'popularity.desc' | 'vote_average.desc' | 'release_date.desc';
}

export interface FilterState {
  contentTypes: ContentType[];
  genreIds: number[];
  decades: string[];
  countries: string[];
  ratingMin: number;
  ratingMax: number;
}