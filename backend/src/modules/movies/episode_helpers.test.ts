import { buildAllEpisodesList } from './episode.helpers';

describe('buildAllEpisodesList', () => {

  it('expands seasons into flat (season, episode) pairs', () => {
    const seasons = [
      { season_number: 1, episode_count: 3 },
      { season_number: 2, episode_count: 2 },
    ];
    const result = buildAllEpisodesList(seasons);
    expect(result).toEqual([
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
      { season: 1, episode: 3 },
      { season: 2, episode: 1 },
      { season: 2, episode: 2 },
    ]);
  });

  it('skips season 0 (Specials)', () => {
    const seasons = [
      { season_number: 0, episode_count: 5 },
      { season_number: 1, episode_count: 2 },
    ];
    const result = buildAllEpisodesList(seasons);
    expect(result).toEqual([
      { season: 1, episode: 1 },
      { season: 1, episode: 2 },
    ]);
  });

  it('returns empty array for no seasons', () => {
    expect(buildAllEpisodesList([])).toEqual([]);
  });

  it('handles a season with zero episodes', () => {
    const seasons = [
      { season_number: 1, episode_count: 0 },
      { season_number: 2, episode_count: 1 },
    ];
    const result = buildAllEpisodesList(seasons);
    expect(result).toEqual([{ season: 2, episode: 1 }]);
  });

  it('counts total episodes correctly across many seasons', () => {
    const seasons = [
      { season_number: 1, episode_count: 10 },
      { season_number: 2, episode_count: 12 },
      { season_number: 3, episode_count: 8 },
    ];
    const result = buildAllEpisodesList(seasons);
    expect(result).toHaveLength(30);
  });

  it('returns empty array when TMDB omits seasons (boundary guard)', () => {
      const seasonsFromTmdb: { season_number: number; episode_count: number }[] | undefined = undefined;
      expect(buildAllEpisodesList(seasonsFromTmdb ?? [])).toEqual([]);
    });
});