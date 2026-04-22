import api from './api';

export interface WatchedEpisode {
  season_number: number;
  episode_number: number;
}

export const episodeService = {
  getWatchedEpisodes: async (seriesTmdbId: number): Promise<WatchedEpisode[]> => {
    const res = await api.get(`/series/${seriesTmdbId}/watched-episodes`);
    return res.data.episodes;
  },

  toggleEpisodeWatch: async (params: {
    series_tmdb_id: number;
    season_number: number;
    episode_number: number;
    episode_tmdb_id?: number;
    total_episodes_in_series?: number;
  }): Promise<{ is_watched: boolean; episodes_watched_count: number }> => {
    const res = await api.post('/series/episode/toggle', params);
    return res.data;
  },
};