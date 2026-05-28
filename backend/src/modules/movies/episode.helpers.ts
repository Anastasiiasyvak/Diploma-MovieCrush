export interface SeasonSummary {
  season_number: number;
  episode_count: number;
}

export const buildAllEpisodesList = (
  seasons: SeasonSummary[] | undefined
): { season: number; episode: number }[] => {
  const result: { season: number; episode: number }[] = [];
  for (const season of seasons ?? []) {
    if (season.season_number === 0) continue; 
    for (let ep = 1; ep <= season.episode_count; ep++) {
      result.push({ season: season.season_number, episode: ep });
    }
  }
  return result;
};