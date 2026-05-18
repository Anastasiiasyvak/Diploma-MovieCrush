import random
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )

REAL_MOVIES = [
    (238, "The Godfather", "drama"), (278, "The Shawshank Redemption", "drama"),
    (13, "Forrest Gump", "drama"), (497, "The Green Mile", "drama"),
    (680, "Pulp Fiction", "drama"), (550, "Fight Club", "drama"),
    (424, "Schindler's List", "drama"), (769, "GoodFellas", "drama"),
    (807, "Se7en", "thriller"), (1422, "The Departed", "drama"),
    (146233, "Prisoners", "thriller"), (210577, "Gone Girl", "thriller"),
    (6977, "No Country for Old Men", "drama"), (7345, "There Will Be Blood", "drama"),
    (242582, "Nightcrawler", "thriller"), (1949, "Zodiac", "thriller"),
    (274, "The Silence of the Lambs", "thriller"),
    
    (98, "Gladiator", "action"), (155, "The Dark Knight", "action"),
    (245891, "John Wick", "action"), (324552, "John Wick 2", "action"),
    (458156, "John Wick 3", "action"), (603692, "John Wick 4", "action"),
    (27205, "Inception", "action"), (299534, "Avengers Endgame", "action"),
    (361743, "Top Gun Maverick", "action"), (562, "Die Hard", "action"),
    (76341, "Mad Max Fury Road", "action"), (24428, "The Avengers", "action"),
    (299536, "Avengers Infinity War", "action"), (949, "Heat", "action"),
    (954, "Mission Impossible", "action"),
    
    (603, "The Matrix", "sci_fi"), (157336, "Interstellar", "sci_fi"),
    (438631, "Dune", "sci_fi"), (693134, "Dune 2", "sci_fi"),
    (19995, "Avatar", "sci_fi"), (329, "Jurassic Park", "sci_fi"),
    (329865, "Arrival", "sci_fi"), (335984, "Blade Runner 2049", "sci_fi"),
    (286217, "The Martian", "sci_fi"), (264660, "Ex Machina", "sci_fi"),
    (49047, "Gravity", "sci_fi"), (11, "Star Wars", "sci_fi"),
    (62, "2001 Space Odyssey", "sci_fi"),
    
    (597, "Titanic", "romance"), (313369, "La La Land", "romance"),
    (11036, "The Notebook", "romance"), (4348, "Pride & Prejudice", "romance"),
    (122906, "About Time", "romance"), (8966, "Twilight", "romance"),
    (19913, "500 Days of Summer", "romance"), (76, "Before Sunrise", "romance"),
    (38, "Eternal Sunshine", "romance"),
    
    (808, "Shrek", "comedy"), (18785, "The Hangover", "comedy"),
    (8363, "Superbad", "comedy"), (64688, "21 Jump Street", "comedy"),
    (12133, "Step Brothers", "comedy"), (293660, "Deadpool", "comedy"),
    (10625, "Mean Girls", "comedy"), (6957, "The 40 Year Old Virgin", "comedy"),
    (55721, "Bridesmaids", "comedy"),
    
    (138843, "The Conjuring", "horror"), (493922, "Hereditary", "horror"),
    (419430, "Get Out", "horror"), (447332, "A Quiet Place", "horror"),
    (346364, "It", "horror"), (694, "The Shining", "horror"),
    (4232, "Scream", "horror"), (176, "Saw", "horror"),
    (9552, "The Exorcist", "horror"),
    
    (120, "Lord of the Rings", "fantasy"), (671, "Harry Potter", "fantasy"),
    (129, "Spirited Away", "anime"), (128, "Princess Mononoke", "anime"),
    (4935, "Howl's Moving Castle", "anime"), (8392, "My Neighbor Totoro", "anime"),
    (372058, "Your Name", "anime"), (378064, "A Silent Voice", "anime"),
    (14160, "Up", "animation"), (862, "Toy Story", "animation"),
    (150540, "Inside Out", "animation"), (354912, "Coco", "animation"),
    (12, "Finding Nemo", "animation"), (8587, "The Lion King", "animation"),
    (2493, "The Princess Bride", "fantasy"), (22, "Pirates Caribbean", "fantasy"),
    
    (1396, "Breaking Bad", "series"), (1399, "Game of Thrones", "series"),
    (66732, "Stranger Things", "series"), (1668, "Friends", "series"),
    (2316, "The Office", "series"), (71912, "The Witcher", "series"),
    (42009, "Black Mirror", "series"), (119051, "Wednesday", "series"),
    (93405, "Squid Game", "series"), (60059, "Better Call Saul", "series"),
    (85552, "Euphoria", "series"), (113988, "DAHMER", "series"),
    (87739, "Queen's Gambit", "series"), (65494, "The Crown", "series"),
    (19885, "Sherlock", "series"), (71446, "Money Heist", "series"),
    (13916, "Death Note", "anime"), (85937, "Demon Slayer", "anime"),
]

USER_PROFILES = [
    {"name": "action_lover", "pref": {"action": 0.9, "sci_fi": 0.7, "drama": 0.3, "romance": 0.1, "comedy": 0.3, "horror": 0.1, "fantasy": 0.4, "anime": 0.1, "animation": 0.2, "series": 0.4, "thriller": 0.5}, "mean": 8, "std": 1.5},
    {"name": "romantic", "pref": {"action": 0.1, "sci_fi": 0.2, "drama": 0.7, "romance": 0.9, "comedy": 0.5, "horror": 0.0, "fantasy": 0.4, "anime": 0.3, "animation": 0.3, "series": 0.5, "thriller": 0.1}, "mean": 8, "std": 1.8},
    {"name": "cinephile", "pref": {"action": 0.5, "sci_fi": 0.5, "drama": 0.9, "romance": 0.5, "comedy": 0.5, "horror": 0.5, "fantasy": 0.5, "anime": 0.5, "animation": 0.5, "series": 0.6, "thriller": 0.7}, "mean": 8.5, "std": 1.2},
    {"name": "blockbuster", "pref": {"action": 0.8, "sci_fi": 0.7, "drama": 0.2, "romance": 0.2, "comedy": 0.6, "horror": 0.1, "fantasy": 0.6, "anime": 0.1, "animation": 0.3, "series": 0.3, "thriller": 0.3}, "mean": 7.5, "std": 1.5},
    {"name": "horror_fan", "pref": {"action": 0.3, "sci_fi": 0.2, "drama": 0.2, "romance": 0.0, "comedy": 0.2, "horror": 0.9, "fantasy": 0.2, "anime": 0.1, "animation": 0.1, "series": 0.3, "thriller": 0.8}, "mean": 7, "std": 2},
    {"name": "anime_fan", "pref": {"action": 0.4, "sci_fi": 0.4, "drama": 0.3, "romance": 0.4, "comedy": 0.4, "horror": 0.2, "fantasy": 0.7, "anime": 0.9, "animation": 0.7, "series": 0.5, "thriller": 0.2}, "mean": 8, "std": 1.5},
    {"name": "series_binger", "pref": {"action": 0.3, "sci_fi": 0.3, "drama": 0.5, "romance": 0.3, "comedy": 0.4, "horror": 0.2, "fantasy": 0.3, "anime": 0.2, "animation": 0.1, "series": 0.9, "thriller": 0.4}, "mean": 8, "std": 1.5},
    {"name": "balanced", "pref": {"action": 0.6, "sci_fi": 0.6, "drama": 0.6, "romance": 0.5, "comedy": 0.6, "horror": 0.4, "fantasy": 0.5, "anime": 0.3, "animation": 0.4, "series": 0.5, "thriller": 0.5}, "mean": 7.5, "std": 1.5},
]

def get_all_user_ids(conn):
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE account_status = 'active' AND id != 20 ORDER BY id")
    users = [row[0] for row in cur.fetchall()]
    cur.close()
    return users

def get_user_movies(conn, user_id):
    cur = conn.cursor()
    cur.execute("SELECT tmdb_id FROM user_movie_actions WHERE user_id = %s AND is_watched = TRUE", (user_id,))
    movies = {row[0] for row in cur.fetchall()}
    cur.close()
    return movies

def add_rating(conn, user_id, tmdb_id, rating):
    cur = conn.cursor()
    is_favorite = rating >= 9
    
    cur.execute("""
        INSERT INTO user_movie_actions (user_id, tmdb_id, is_watched, is_favorite, is_disliked, updated_at)
        VALUES (%s, %s, TRUE, %s, FALSE, NOW())
        ON CONFLICT (user_id, tmdb_id) DO UPDATE
        SET is_watched = TRUE, is_favorite = EXCLUDED.is_favorite, updated_at = NOW()
    """, (user_id, tmdb_id, is_favorite))
    
    cur.execute("""
        INSERT INTO user_detailed_ratings (user_id, tmdb_id, overall_rating, updated_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (user_id, tmdb_id) DO UPDATE
        SET overall_rating = EXCLUDED.overall_rating, updated_at = NOW()
    """, (user_id, tmdb_id, rating))
    
    cur.close()

if __name__ == "__main__":
    
    conn = get_connection()
    users = get_all_user_ids(conn)
    print(f"\nFound users for processing: {len(users)}")
    
    total_ratings = 0
    movies_list = list(REAL_MOVIES)
    
    for user_id in users:
        existing_movies = get_user_movies(conn, user_id)
        existing_count = len(existing_movies)
        
        target = random.randint(40, 55)
        to_add = max(0, target - existing_count)
        
        if to_add == 0:
            print(f"User {user_id}: already has {existing_count} ratings")
            continue
        
        profile = random.choice(USER_PROFILES)
        pref = profile["pref"]
        std = profile["std"]
        
        available = [m for m in movies_list if m[0] not in existing_movies]
        
        if len(available) < to_add:
            to_add = len(available)
        
        selected = random.sample(available, to_add)
        
        print(f"\nUser {user_id}: profile '{profile['name']}', adding {to_add} movies (had {existing_count})...")
        
        for tmdb_id, title, genre in selected:
            base = pref.get(genre, 0.5) * 10
            rating = base + random.gauss(0, std)
            rating = max(1, min(10, round(rating, 1)))
            
            add_rating(conn, user_id, tmdb_id, rating)
            total_ratings += 1
        
        print(f" Added {to_add} ratings")
    
    conn.commit()
    conn.close()
    
    print("\n" + "=" * 60)
    print(f"Ready! Total {total_ratings} ratings added")
    print("=" * 60)