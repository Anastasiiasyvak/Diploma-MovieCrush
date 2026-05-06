export interface WrappedTopActor {
  tmdb_id: number;
  name: string;
  votes: number;
}

export interface WrappedSummary {
  wrapped_year: number;
  computed_at: string;

  total_minutes: number;
  total_hours: number;
  total_days: number;

  cinema_vibe: string | null;
  cinema_vibe_stat: string | null;

  movies_count: number;
  series_count: number;
  episodes_count: number;

  top_genre: { id: number; name: string } | null;
  top_director: { id: number; name: string } | null;
  top_actors: WrappedTopActor[];

  top_mood: { mood: string; count: number } | null;

  watch_habits: {
    weekday: number | null;
    hour: number | null;
  };

  top_fan: {
    actor_id: number;
    actor_name: string;
    minutes: number;
    percentile: number | null;
  } | null;
}