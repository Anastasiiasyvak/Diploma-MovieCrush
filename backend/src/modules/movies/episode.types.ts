export interface EpisodeWatchInput {
  series_tmdb_id: number;
  season_number: number;
  episode_number: number;
  episode_tmdb_id?: number;
  total_episodes_in_series?: number;
  total_seasons_in_series?: number;
}