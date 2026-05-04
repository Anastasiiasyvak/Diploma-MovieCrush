// backend/src/modules/wrapped/wrapped.types.ts
//
// Типи для модуля Wrapped — і для внутрішнього використання (computeXxx результати),
// і для відповіді API мобілці.

// ── Sub-pieces ───────────────────────────────────────────────────────────

export interface WrappedTopActor {
  tmdb_id: number;
  name:    string;
  votes:   number;
}

export interface WrappedTopMovie {
  tmdb_id:        number;
  title:          string;
  poster_path:    string | null;
  overall_rating: number;
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
  weekday: number | null;   // 0..6 (0 = Sunday)
  hour:    number | null;   // 0..23
  month:   number | null;   // 1..12
}

export interface WrappedTopFan {
  actor_id:   number;
  actor_name: string;
  minutes:    number;
  percentile: number | null;
}

// ── Main response shape (повертається мобілці через /api/wrapped/me) ────

export interface WrappedSummary {
  wrapped_year: number;
  computed_at:  string;

  // Slide 2: total time
  total_minutes: number;
  total_hours:   number;
  total_days:    number;

  // Slide 3: cinema age
  avg_release_year: number | null;
  cinema_age:       number | null;

  // Slide 4: counts
  movies_count:   number;
  series_count:   number;
  episodes_count: number;

  // Slides 5-6: top genre/director
  top_genre:    WrappedTopGenre    | null;
  top_director: WrappedTopDirector | null;

  // Slide 7: top 5 actors (з user_best_actor_votes)
  top_actors: WrappedTopActor[];

  // Slide 8: top movie of the year
  top_movie: WrappedTopMovie | null;

  // Slide 10: top mood
  top_mood: WrappedTopMood | null;

  // Slide 11: watch habits
  watch_habits: WrappedWatchHabits;

  // Slide 12: top fan
  top_fan: WrappedTopFan | null;
}

// ── Internal types для service.ts (між sub-functions) ────────────────────

export interface BasicStats {
  total_minutes:    number;
  total_hours:      number;
  total_days:       number;
  avg_release_year: number | null;
  cinema_age:       number | null;
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