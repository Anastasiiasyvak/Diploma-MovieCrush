import { LRUCache } from 'lru-cache';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

const tmdbLruCache = new LRUCache<string, object>({
  max: 500,
  ttl: 5 * 60 * 1000,
});

export const fetchFromTMDB = async <T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured on the server');
  }

  const cacheParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      cacheParams.set(key, String(value));
    }
  }
  const cacheKey = cacheParams.toString()
    ? `${endpoint}?${cacheParams.toString()}`
    : endpoint;

  if (tmdbLruCache.has(cacheKey)) {
    return tmdbLruCache.get(cacheKey) as T;
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'en-US');
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB error: ${response.status}`);
  }

  const data = await response.json() as T;
  tmdbLruCache.set(cacheKey, data as object);
  return data;
};