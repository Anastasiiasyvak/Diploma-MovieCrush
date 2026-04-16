export interface SeriesDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  last_air_date: string;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
  production_countries: { iso_3166_1: string; name: string }[];
  spoken_languages: { english_name: string }[];
  status: string;        
  tagline: string | null;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];      
  seasons: SeriesSeason[];
  created_by: { id: number; name: string; profile_path: string | null }[];
  networks: { id: number; name: string; logo_path: string | null }[];
  in_production: boolean;
}

export interface SeriesSeason {
  id: number;
  name: string;
  season_number: number;
  episode_count: number;
  overview: string;
  poster_path: string | null;
  air_date: string | null;
  vote_average: number;
}

export interface SeriesSeasonDetail {
  id: number;
  name: string;
  season_number: number;
  overview: string;
  poster_path: string | null;
  air_date: string | null;
  episodes: SeriesEpisode[];
}

export interface SeriesEpisode {
  id: number;
  name: string;
  episode_number: number;
  season_number: number;
  overview: string;
  still_path: string | null;
  air_date: string | null;
  vote_average: number;
  runtime: number | null;
}


export interface SeriesCredits {
  cast: SeriesCastMember[];
  crew: SeriesCrewMember[];
}

export interface SeriesCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface SeriesCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface SeriesImage {
  file_path: string;
  width: number;
  height: number;
}

export interface SeriesImagesResponse {
  backdrops: SeriesImage[];
  posters: SeriesImage[];
}

export interface SeriesVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface SeriesVideosResponse {
  results: SeriesVideo[];
}

export interface SimilarSeries {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string;
}