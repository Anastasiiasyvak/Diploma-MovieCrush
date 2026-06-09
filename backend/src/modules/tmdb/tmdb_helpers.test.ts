import { parseTmdbId } from './tmdb.helpers';

describe('parseTmdbId', () => {

  it('accepts a positive integer and returns it unchanged', () => {
    expect(parseTmdbId(238)).toBe(238);
  });

  it('accepts a numeric string and converts it to number', () => {
    expect(parseTmdbId('238')).toBe(238);
  });

  it('accepts a long numeric string (PostgreSQL bigint case)', () => {
    expect(parseTmdbId('9007199254740990')).toBe(9007199254740990);
  });

  it('returned value is always a real number type, not a string', () => {
    const result = parseTmdbId('42');
    expect(typeof result).toBe('number');
  });

  it('rejects zero', () => {
    expect(parseTmdbId(0)).toBeNull();
  });

  it('rejects zero as string', () => {
    expect(parseTmdbId('0')).toBeNull();
  });

  it('rejects negative number', () => {
    expect(parseTmdbId(-5)).toBeNull();
  });

  it('rejects floating-point number (TMDB ids are always integers)', () => {
    expect(parseTmdbId(3.14)).toBeNull();
  });

  it('rejects NaN', () => {
    expect(parseTmdbId(NaN)).toBeNull();
  });

  it('rejects Infinity', () => {
    expect(parseTmdbId(Infinity)).toBeNull();
  });

  it('rejects null', () => {
    expect(parseTmdbId(null)).toBeNull();
  });

  it('rejects undefined', () => {
    expect(parseTmdbId(undefined)).toBeNull();
  });

  it('rejects empty string', () => {
    expect(parseTmdbId('')).toBeNull();
  });

  it('rejects non-numeric string', () => {
    expect(parseTmdbId('abc')).toBeNull();
  });

  it('rejects mixed alphanumeric string', () => {
    expect(parseTmdbId('123abc')).toBeNull();
  });

  it('rejects string with leading minus', () => {
    expect(parseTmdbId('-5')).toBeNull();
  });

  it('rejects string with leading plus', () => {
    expect(parseTmdbId('+5')).toBeNull();
  });

  it('rejects decimal string', () => {
    expect(parseTmdbId('3.14')).toBeNull();
  });

  it('rejects string with whitespace', () => {
    expect(parseTmdbId(' 238 ')).toBeNull();
  });

  it('rejects hex-like string', () => {
    expect(parseTmdbId('0x10')).toBeNull();
  });

  it('rejects boolean true', () => {
    expect(parseTmdbId(true)).toBeNull();
  });

  it('rejects boolean false', () => {
    expect(parseTmdbId(false)).toBeNull();
  });

  it('rejects array', () => {
    expect(parseTmdbId([238])).toBeNull();
  });

  it('rejects object', () => {
    expect(parseTmdbId({ tmdb_id: 238 })).toBeNull();
  });
});