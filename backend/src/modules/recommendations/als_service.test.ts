import {
  cacheRowToAlsItem,
  mediaTypeFromTmdb,
  releaseYearFromTmdb,
  sliceToLimit,
  filterValidItems,
  type CacheRow,
  type AlsItem,
} from './als_service';

const makeCache = (tmdb_id: number, overrides: Partial<CacheRow> = {}): CacheRow => ({
  tmdb_id,
  media_type: 'movie',
  title: `Movie ${tmdb_id}`,
  poster_path: `/poster_${tmdb_id}.jpg`,
  release_year: 2020,
  vote_average: 7.5,
  ...overrides,
});


describe('release_date formatting', () => {

  it('formats release_year as YYYY-01-01', () => {
    const item = cacheRowToAlsItem(238, makeCache(238, { release_year: 1972 }));
    expect(item.release_date).toBe('1972-01-01');
  });

  it('returns empty string when release_year is null', () => {
    const item = cacheRowToAlsItem(1, makeCache(1, { release_year: null }));
    expect(item.release_date).toBe('');
  });

  it('handles modern year correctly', () => {
    const item = cacheRowToAlsItem(1, makeCache(1, { release_year: 2024 }));
    expect(item.release_date).toBe('2024-01-01');
  });

  it('handles old year correctly', () => {
    const item = cacheRowToAlsItem(1, makeCache(1, { release_year: 1960 }));
    expect(item.release_date).toBe('1960-01-01');
  });
});


describe('vote_average', () => {

  it('uses vote_average from cache', () => {
    const item = cacheRowToAlsItem(1, makeCache(1, { vote_average: 8.7 }));
    expect(item.vote_average).toBe(8.7);
  });

  it('defaults to 0 when vote_average is null', () => {
    const item = cacheRowToAlsItem(1, makeCache(1, { vote_average: null }));
    expect(item.vote_average).toBe(0);
  });

  it('handles 0 vote_average correctly', () => {
    const item = cacheRowToAlsItem(1, makeCache(1, { vote_average: 0 }));
    expect(item.vote_average).toBe(0);
  });
});


describe('mediaTypeFromTmdb', () => {

  it('returns movie when title exists', () => {
    expect(mediaTypeFromTmdb({ title: 'The Godfather' })).toBe('movie');
  });

  it('returns tv when only name exists', () => {
    expect(mediaTypeFromTmdb({ name: 'Breaking Bad' })).toBe('tv');
  });

  it('returns movie when both title and name exist', () => {
    expect(mediaTypeFromTmdb({ title: 'Movie', name: 'Series' })).toBe('movie');
  });

  it('returns tv when neither title nor name', () => {
    expect(mediaTypeFromTmdb({})).toBe('tv');
  });
});


describe('releaseYearFromTmdb', () => {

  it('extracts year from release_date', () => {
    expect(releaseYearFromTmdb({ release_date: '1972-03-24' })).toBe(1972);
  });

  it('extracts year from first_air_date when no release_date', () => {
    expect(releaseYearFromTmdb({ first_air_date: '2008-01-20' })).toBe(2008);
  });

  it('prefers release_date over first_air_date', () => {
    expect(releaseYearFromTmdb({ release_date: '2020-01-01', first_air_date: '2019-01-01' })).toBe(2020);
  });

  it('returns null when no dates', () => {
    expect(releaseYearFromTmdb({})).toBeNull();
  });

  it('handles empty string dates', () => {
    expect(releaseYearFromTmdb({ release_date: '' })).toBeNull();
  });
});


describe('sliceToLimit', () => {

  const makeItems = (count: number): AlsItem[] =>
    Array.from({ length: count }, (_, i) => cacheRowToAlsItem(i + 1, makeCache(i + 1)));

  it('never returns more than 25 items', () => {
    expect(sliceToLimit(makeItems(40)).length).toBe(25);
  });

  it('returns all items when fewer than 25', () => {
    expect(sliceToLimit(makeItems(10)).length).toBe(10);
  });

  it('returns exactly 25 when input is exactly 25', () => {
    expect(sliceToLimit(makeItems(25)).length).toBe(25);
  });

  it('returns empty array for empty input', () => {
    expect(sliceToLimit([])).toEqual([]);
  });
});


describe('filterValidItems', () => {

  it('preserves ALS order from tmdb_ids', () => {
    const ids = [300, 100, 200];
    const map = new Map(ids.map(id => [id, makeCache(id)]));
    const result = filterValidItems(ids, map);
    expect(result.map(r => r.tmdb_id)).toEqual([300, 100, 200]);
  });

  it('skips items not in cache', () => {
    const map = new Map([[1, makeCache(1)], [3, makeCache(3)]]);
    const result = filterValidItems([1, 2, 3], map);
    expect(result.map(r => r.tmdb_id)).toEqual([1, 3]);
  });

  it('skips items with null title', () => {
    const map = new Map([
      [1, makeCache(1)],
      [2, makeCache(2, { title: null })],
      [3, makeCache(3)],
    ]);
    const result = filterValidItems([1, 2, 3], map);
    expect(result.map(r => r.tmdb_id)).toEqual([1, 3]);
  });

  it('returns empty array for empty ids', () => {
    const map = new Map([[1, makeCache(1)]]);
    expect(filterValidItems([], map)).toEqual([]);
  });

  it('returns empty array when all items missing from cache', () => {
    const map = new Map<number, CacheRow>();
    expect(filterValidItems([1, 2, 3], map)).toEqual([]);
  });
});


describe('AlsItem structure', () => {

  it('has all required fields', () => {
    const item = cacheRowToAlsItem(238, makeCache(238));
    expect(item).toHaveProperty('tmdb_id');
    expect(item).toHaveProperty('media_type');
    expect(item).toHaveProperty('title');
    expect(item).toHaveProperty('poster_path');
    expect(item).toHaveProperty('vote_average');
    expect(item).toHaveProperty('overview');
    expect(item).toHaveProperty('release_date');
  });

  it('overview is always empty string', () => {
    const item = cacheRowToAlsItem(1, makeCache(1));
    expect(item.overview).toBe('');
  });

  it('poster_path can be null', () => {
    const item = cacheRowToAlsItem(1, makeCache(1, { poster_path: null }));
    expect(item.poster_path).toBeNull();
  });

  it('tmdb_id matches input id', () => {
    const item = cacheRowToAlsItem(12345, makeCache(12345));
    expect(item.tmdb_id).toBe(12345);
  });
});