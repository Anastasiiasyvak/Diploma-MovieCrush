const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// тут я додала централізований виклик tmdb api, тобто серверний ключ 
// TMDB_API_KEY береться з process.env і ніколи не потрапляє в клієнтський код
export const fetchFromTMDB = async <T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error('TMDB_API_KEY is not configured on the server');
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
  return response.json() as Promise<T>;
};