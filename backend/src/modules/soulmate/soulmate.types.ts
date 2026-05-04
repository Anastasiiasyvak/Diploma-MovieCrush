export interface SimilarityBreakdown {
  total: number;  
  rating_similarity: number;
  genre_similarity: number;
  actor_similarity: number;
  mood_similarity: number;
  director_similarity: number;
  disliked_similarity: number;
}

export interface SoulmateResponse {
  matched_user: {
    id: number;
    username: string;
    first_name: string | null;
    last_name: string | null;
    profile_image_url: string | null;
  };

  similarity_score: number; 
  similarity_percent: number;   

  breakdown: {
    rating: number;
    genre: number;
    actor: number;
    mood: number;
    director: number;
    disliked: number;
  };

  shared_movies_count: number;
  top_shared_movies: number[];
  shared_genres: string[];
  shared_disliked: number[];

  wrapped_year: number;
  computed_at: string;
}