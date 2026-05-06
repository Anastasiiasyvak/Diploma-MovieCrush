export interface WrappedTopActor {
  tmdb_id: number;
  name:    string;
  votes:   number;
}

export interface WrappedTopGenre {
  id:   number;
  name: string;
}

export interface WrappedTopDirector {
  id:   number;
  name: string;
}

export interface WrappedTopMood {
  mood:  string;
  count: number;
}

export interface WrappedWatchHabits {
  weekday: number | null;
  hour:    number | null;    
}

export interface WrappedTopFan {
  actor_id:   number;
  actor_name: string;
  minutes:    number;
  percentile: number | null;
}

export interface WrappedSummary {
  wrapped_year: number;
  computed_at:  string;

  total_minutes: number;
  total_hours:   number;
  total_days:    number;

  cinema_vibe:      string | null;
  cinema_vibe_stat: string | null;

  movies_count:   number;
  series_count:   number;
  episodes_count: number;

  top_genre:    WrappedTopGenre    | null;
  top_director: WrappedTopDirector | null;

  top_actors: WrappedTopActor[];

  top_mood: WrappedTopMood | null;

  watch_habits: WrappedWatchHabits;

  top_fan: WrappedTopFan | null;
}

export interface BasicStats {
  total_minutes:    number;
  total_hours:      number;
  total_days:       number;
  cinema_vibe:       string | null;
  cinema_vibe_stat:  string | null;
  movies_count:     number;
  series_count:     number;
}

export interface TopGenreResult {
  top_genre_id:   number | null;
  top_genre_name: string | null;
}

export interface TopDirectorResult {
  top_director_id:   number | null;
  top_director_name: string | null;
}

export interface TopMoodResult {
  top_mood:   string | null;
  mood_count: number;
}

export interface TopFanResult {
  topfan_actor_id:   number | null;
  topfan_actor_name: string | null;
  topfan_minutes:    number;
  topfan_percentile: number | null;
}