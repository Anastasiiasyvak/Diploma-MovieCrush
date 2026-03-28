export const TMDB_API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY ?? '';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export const POSTER_SIZES = {
  small:  `${TMDB_IMAGE_BASE}/w185`,
  medium: `${TMDB_IMAGE_BASE}/w342`,
  large:  `${TMDB_IMAGE_BASE}/w500`,
} as const;