import api from './api';
import { MovieActions, DetailedRating, MovieComment, MoodType, UserList } from '../types/movie.types';

export const movieService = {
  getActions: async (tmdbId: number): Promise<MovieActions> => {
    const res = await api.get(`/movies/${tmdbId}/actions`);
    return res.data;
  },

  toggleAction: async (
    tmdbId: number,
    action: 'favorite' | 'watchlist' | 'watched' | 'dislike',
    mediaType: 'movie' | 'tv' = 'movie',
  ): Promise<MovieActions> => {
    const res = await api.post('/movies/actions', { tmdb_id: tmdbId, action, media_type: mediaType });
    return res.data;
  },

  getMyLists: async (): Promise<UserList[]> => {
    const res = await api.get('/movies/my-lists');
    return res.data.lists;
  },

  getListItems: async (listId: number): Promise<{ tmdb_id: number; media_type: string; added_at: string }[]> => {
    const res = await api.get(`/movies/lists/${listId}/items`);
    return res.data.items;
  },

  addToList: async (listId: number, tmdbId: number, mediaType: 'movie' | 'tv' = 'movie'): Promise<void> => {
    await api.post('/movies/lists/add', { list_id: listId, tmdb_id: tmdbId, media_type: mediaType });
  },

  removeFromList: async (listId: number, tmdbId: number): Promise<{
    list_type: string;
    actions: { is_favorite: boolean; is_watchlist: boolean; is_watched: boolean; is_disliked: boolean };
  }> => { 
    const res = await api.delete(`/movies/lists/${listId}/items/${tmdbId}`);
    return res.data;
  },

  getRating: async (tmdbId: number): Promise<DetailedRating> => {
    const res = await api.get(`/movies/${tmdbId}/rating`);
    return res.data;
  },

  saveRating: async (tmdbId: number, rating: Partial<DetailedRating>): Promise<DetailedRating> => {
    const res = await api.post('/movies/rating', { tmdb_id: tmdbId, ...rating });
    return res.data;
  },

  getMood: async (tmdbId: number): Promise<MoodType | null> => {
    const res = await api.get(`/movies/${tmdbId}/mood`);
    return res.data.mood;
  },

  saveMood: async (tmdbId: number, mood: MoodType): Promise<MoodType> => {
    const res = await api.post('/movies/mood', { tmdb_id: tmdbId, mood });
    return res.data.mood;
  },

  getComments: async (tmdbId: number, page = 1): Promise<MovieComment[]> => {
    const res = await api.get(`/movies/${tmdbId}/comments`, { params: { page } });
    return res.data.comments;
  },

  postComment: async (
    tmdbId: number,
    comment_text: string,
    is_anonymous: boolean,
    has_spoiler: boolean,
  ): Promise<MovieComment> => {
    const res = await api.post('/movies/comments', { tmdb_id: tmdbId, comment_text, is_anonymous, has_spoiler });
    return res.data.comment;
  },

  editComment: async (commentId: number, comment_text: string): Promise<MovieComment> => {
    const res = await api.patch(`/movies/comments/${commentId}`, { comment_text });
    return res.data.comment;
  },

  deleteComment: async (commentId: number): Promise<void> => {
    await api.delete(`/movies/comments/${commentId}`);
  },

  reactToComment: async (
    commentId: number,
    is_like: boolean,
  ): Promise<{ likes_count: number; dislikes_count: number; my_reaction: 'like' | 'dislike' | null }> => {
    const res = await api.post(`/movies/comments/${commentId}/react`, { is_like });
    return res.data;
  },

  getBestActorVote: async (tmdbId: number) => {
    const res = await api.get(`/movies/${tmdbId}/best-actor`);
    return res.data as { actor_tmdb_id: number | null; actor_name: string | null };
  },

  voteBestActor: async (tmdbId: number, actor_tmdb_id: number, actor_name: string) => {
    const res = await api.post('/movies/best-actor', { tmdb_id: tmdbId, actor_tmdb_id, actor_name });
    return res.data;
  },

  resetAllRatings: async (tmdbId: number): Promise<void> => {
    await api.delete(`/movies/${tmdbId}/my-ratings`);
  },
};