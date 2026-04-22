export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  deathday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  gender: number; // 0 - не визначено, 1 - female, 2 - male, 3- non-binary
  also_known_as: string[];
  homepage: string | null;
  imdb_id: string | null;
  adult: boolean;
}

export interface CastCredit {
  id: number;
  title?: string; // фільм
  name?: string; // серіал
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  backdrop_path: string | null;
  character?: string;
  release_date?: string; // муві
  first_air_date?: string; // серіал
  vote_average: number;
  vote_count: number;
  overview: string;
  genre_ids: number[];
  popularity: number;
  order?: number; // order of billing in cast 
  episode_count?: number; 
}

export interface CrewCredit {
  id: number;
  title?: string;
  name?: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  backdrop_path: string | null;
  job: string;
  department: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  overview: string;
  genre_ids: number[];
  popularity: number;
}

export interface PersonCredits {
  cast: CastCredit[];
  crew: CrewCredit[];
}

export interface PersonResponse {
  details: PersonDetails;
  credits: PersonCredits;
}