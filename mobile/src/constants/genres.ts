import { ContentType } from '../types/tmdb.types';

export const CONTENT_TYPES: { key: ContentType; label: string; emoji: string }[] = [
  { key: 'movie',           label: 'Movie',          emoji: '🎬' },
  { key: 'tv',              label: 'Series',         emoji: '📺' },
  { key: 'anime',           label: 'Anime',          emoji: '⛩️' },
  { key: 'animation',       label: 'Cartoon',        emoji: '🎨' },
  { key: 'animated_series', label: 'Cartoon Series', emoji: '🌀' },
  { key: 'dorama',          label: 'Dorama',         emoji: '🌸' },
];

export const MOVIE_GENRES = [
  { id: 28,    name: 'Action' },
  { id: 12,    name: 'Adventure' },
  { id: 35,    name: 'Comedy' },
  { id: 80,    name: 'Crime' },
  { id: 99,    name: 'Documentary' },
  { id: 18,    name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 14,    name: 'Fantasy' },
  { id: 36,    name: 'History' },
  { id: 27,    name: 'Horror' },
  { id: 10402, name: 'Music' },
  { id: 9648,  name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878,   name: 'Science Fiction' },
  { id: 53,    name: 'Thriller' },
  { id: 10752, name: 'War' },
  { id: 37,    name: 'Western' },
] as const;


export const TV_GENRES = [
  { id: 10759, name: 'Action & Adventure' },
  { id: 35,    name: 'Comedy' },
  { id: 80,    name: 'Crime' },
  { id: 99,    name: 'Documentary' },
  { id: 18,    name: 'Drama' },
  { id: 10751, name: 'Family' },
  { id: 10762, name: 'Kids' },
  { id: 9648,  name: 'Mystery' },
  { id: 10763, name: 'News' },
  { id: 10764, name: 'Reality' },
  { id: 10765, name: 'Sci-Fi & Fantasy' },
  { id: 10766, name: 'Soap' },
  { id: 10767, name: 'Talk' },
  { id: 10768, name: 'War & Politics' },
  { id: 37,    name: 'Western' },
] as const;

export const getRelevantGenres = (types: ContentType[]) => {
  const hasTv    = types.some(t => ['tv', 'anime', 'animated_series', 'dorama'].includes(t));
  const hasMovie = types.some(t => ['movie', 'animation'].includes(t));
  if (hasTv && !hasMovie) return [...TV_GENRES];
  if (hasMovie && !hasTv) return [...MOVIE_GENRES];

  const all = [...MOVIE_GENRES] as { id: number; name: string }[];
  TV_GENRES.forEach(g => { if (!all.find(x => x.id === g.id)) all.push(g); });
  return all.sort((a, b) => a.name.localeCompare(b.name));
};


export const DECADES = [
  { label: '2020s', from: '2020', to: '2029' },
  { label: '2010s', from: '2010', to: '2019' },
  { label: '2000s', from: '2000', to: '2009' },
  { label: '1990s', from: '1990', to: '1999' },
  { label: '1980s', from: '1980', to: '1989' },
  { label: '1970s', from: '1970', to: '1979' },
  { label: '1960s', from: '1960', to: '1969' },
  { label: '1950s', from: '1950', to: '1959' },
  { label: '1940s', from: '1940', to: '1949' },
  { label: '1930s', from: '1930', to: '1939' },
  { label: '1920s', from: '1920', to: '1929' },
  { label: '1910s', from: '1910', to: '1919' },
  { label: '1900s', from: '1900', to: '1909' },
  { label: '1880s', from: '1888', to: '1899' },
] as const;


export const COUNTRIES = [
  { code: 'US', name: '🇺🇸 USA' },
  { code: 'GB', name: '🇬🇧 UK' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'IT', name: '🇮🇹 Italy' },
  { code: 'ES', name: '🇪🇸 Spain' },
  { code: 'JP', name: '🇯🇵 Japan' },
  { code: 'KR', name: '🇰🇷 South Korea' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'CN', name: '🇨🇳 China' },
  { code: 'UA', name: '🇺🇦 Ukraine' },
  { code: 'PL', name: '🇵🇱 Poland' },
  { code: 'SE', name: '🇸🇪 Sweden' },
  { code: 'DK', name: '🇩🇰 Denmark' },
  { code: 'NO', name: '🇳🇴 Norway' },
  { code: 'FI', name: '🇫🇮 Finland' },
  { code: 'TR', name: '🇹🇷 Turkey' },
  { code: 'MX', name: '🇲🇽 Mexico' },
  { code: 'BR', name: '🇧🇷 Brazil' },
  { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'CO', name: '🇨🇴 Colombia' },
  { code: 'CL', name: '🇨🇱 Chile' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'NZ', name: '🇳🇿 New Zealand' },
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'NL', name: '🇳🇱 Netherlands' },
  { code: 'PT', name: '🇵🇹 Portugal' },
  { code: 'GR', name: '🇬🇷 Greece' },
  { code: 'CZ', name: '🇨🇿 Czechia' },
  { code: 'HU', name: '🇭🇺 Hungary' },
  { code: 'RO', name: '🇷🇴 Romania' },
  { code: 'AT', name: '🇦🇹 Austria' },
  { code: 'CH', name: '🇨🇭 Switzerland' },
  { code: 'BE', name: '🇧🇪 Belgium' },
  { code: 'IE', name: '🇮🇪 Ireland' },
  { code: 'IS', name: '🇮🇸 Iceland' },
  { code: 'IL', name: '🇮🇱 Israel' },
  { code: 'IR', name: '🇮🇷 Iran' },
  { code: 'SA', name: '🇸🇦 Saudi Arabia' },
  { code: 'EG', name: '🇪🇬 Egypt' },
  { code: 'MA', name: '🇲🇦 Morocco' },
  { code: 'NG', name: '🇳🇬 Nigeria' },
  { code: 'ZA', name: '🇿🇦 South Africa' },
  { code: 'ET', name: '🇪🇹 Ethiopia' },
  { code: 'TH', name: '🇹🇭 Thailand' },
  { code: 'ID', name: '🇮🇩 Indonesia' },
  { code: 'PH', name: '🇵🇭 Philippines' },
  { code: 'VN', name: '🇻🇳 Vietnam' },
  { code: 'MY', name: '🇲🇾 Malaysia' },
  { code: 'TW', name: '🇹🇼 Taiwan' },
  { code: 'HK', name: '🇭🇰 Hong Kong' },
  { code: 'SG', name: '🇸🇬 Singapore' },
  { code: 'PK', name: '🇵🇰 Pakistan' },
  { code: 'BD', name: '🇧🇩 Bangladesh' },
  { code: 'AF', name: '🇦🇫 Afghanistan' },
  { code: 'RU', name: 'russia is a terrorist state' },
] as const;


export const DEFAULT_FILTERS = {
  contentTypes: [] as ContentType[],
  genreIds:     [] as number[],
  decades:      [] as string[],
  countries:    [] as string[],
  ratingMin:    1,
  ratingMax:    10,
};