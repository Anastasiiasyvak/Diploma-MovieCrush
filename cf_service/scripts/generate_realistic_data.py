import random
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

PROTECTED_USER_IDS = {
    1, 3, 4, 5, 6, 8, 9, 13, 16, 17, 18, 20, 21, 22, 23,
    24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35
}


def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
    )


MOVIE_CLUSTERS = {
    "marvel_mcu": [
        (24428, "Avengers", 0.95),
        (299536, "Infinity War", 0.93),
        (299534, "Endgame", 0.97),
        (293660, "Deadpool", 0.85),
        (1726, "Iron Man", 0.80),
        (10138, "Iron Man 2", 0.70),
        (68721, "Iron Man 3", 0.65),
        (1771, "Captain America", 0.72),
        (271110, "Civil War", 0.85),
        (315635, "Spider-Man Homecoming", 0.78),
        (429617, "Spider-Man Far From Home", 0.75),
    ],
    "john_wick_franchise": [
        (245891, "John Wick", 0.85),
        (324552, "John Wick 2", 0.78),
        (458156, "John Wick 3", 0.72),
        (603692, "John Wick 4", 0.75),
    ],
    "nolan_films": [
        (155, "Dark Knight", 0.95),
        (27205, "Inception", 0.92),
        (157336, "Interstellar", 0.90),
        (49026, "Dark Knight Rises", 0.80),
        (272, "Batman Begins", 0.75),
        (577922, "Tenet", 0.65),
        (872585, "Oppenheimer", 0.88),
    ],
    "tarantino": [
        (680, "Pulp Fiction", 0.88),
        (500, "Reservoir Dogs", 0.70),
        (273248, "Hateful Eight", 0.62),
        (273, "Inglourious Basterds", 0.80),
        (68718, "Django Unchained", 0.82),
        (24, "Kill Bill", 0.75),
    ],
    "horror_modern": [
        (138843, "The Conjuring", 0.78),
        (493922, "Hereditary", 0.65),
        (419430, "Get Out", 0.75),
        (447332, "A Quiet Place", 0.72),
        (346364, "It", 0.80),
        (530385, "Midsommar", 0.55),
        (646385, "Scream 5", 0.50),
    ],
    "ghibli": [
        (129, "Spirited Away", 0.85),
        (128, "Princess Mononoke", 0.70),
        (4935, "Howl's Moving Castle", 0.75),
        (8392, "My Neighbor Totoro", 0.72),
        (12477, "Grave of the Fireflies", 0.55),
        (10515, "Castle in the Sky", 0.50),
    ],
    "anime_films": [
        (372058, "Your Name", 0.80),
        (378064, "A Silent Voice", 0.60),
        (508965, "Weathering With You", 0.55),
    ],
    "pixar": [
        (14160, "Up", 0.85),
        (862, "Toy Story", 0.90),
        (863, "Toy Story 2", 0.78),
        (10193, "Toy Story 3", 0.82),
        (150540, "Inside Out", 0.83),
        (354912, "Coco", 0.80),
        (12, "Finding Nemo", 0.85),
        (508943, "Luca", 0.65),
        (920, "Cars", 0.70),
    ],
    "lotr_hobbit": [
        (120, "LOTR Fellowship", 0.90),
        (121, "LOTR Two Towers", 0.85),
        (122, "LOTR Return King", 0.88),
        (49051, "Hobbit Unexpected", 0.65),
        (57158, "Hobbit Desolation", 0.60),
    ],
    "harry_potter": [
        (671, "Philosopher Stone", 0.85),
        (672, "Chamber Secrets", 0.78),
        (673, "Prisoner Azkaban", 0.80),
        (674, "Goblet of Fire", 0.75),
        (767, "Half-Blood Prince", 0.70),
    ],
    "romance_classics": [
        (597, "Titanic", 0.90),
        (313369, "La La Land", 0.78),
        (11036, "The Notebook", 0.72),
        (4348, "Pride & Prejudice", 0.60),
        (19913, "500 Days of Summer", 0.65),
        (38, "Eternal Sunshine", 0.62),
    ],
    "thrillers_dark": [
        (807, "Se7en", 0.82),
        (274, "Silence of Lambs", 0.85),
        (146233, "Prisoners", 0.70),
        (210577, "Gone Girl", 0.75),
        (1949, "Zodiac", 0.65),
        (242582, "Nightcrawler", 0.60),
        (550, "Fight Club", 0.88),
    ],
    "scifi_modern": [
        (438631, "Dune", 0.80),
        (693134, "Dune 2", 0.78),
        (264660, "Ex Machina", 0.60),
        (329865, "Arrival", 0.65),
        (335984, "Blade Runner 2049", 0.62),
        (286217, "The Martian", 0.78),
        (49047, "Gravity", 0.68),
    ],
    "comedy_modern": [
        (18785, "The Hangover", 0.82),
        (8363, "Superbad", 0.70),
        (64688, "21 Jump Street", 0.68),
        (12133, "Step Brothers", 0.65),
        (10625, "Mean Girls", 0.78),
        (55721, "Bridesmaids", 0.62),
    ],
    "korean_wave": [
        (496243, "Parasite", 0.85),
        (93405, "Squid Game", 0.92),
        (38575, "Oldboy", 0.55),
        (530915, "1917", 0.65),
    ],
    "series_drama": [
        (1396, "Breaking Bad", 0.95),
        (60059, "Better Call Saul", 0.75),
        (1399, "Game of Thrones", 0.92),
        (66732, "Stranger Things", 0.90),
        (1668, "Friends", 0.85),
        (2316, "The Office", 0.83),
        (85552, "Euphoria", 0.65),
        (87739, "Queen's Gambit", 0.72),
    ],
    "classics": [
        (238, "Godfather", 0.85),
        (240, "Godfather 2", 0.75),
        (278, "Shawshank", 0.93),
        (13, "Forrest Gump", 0.90),
        (424, "Schindler's List", 0.78),
        (769, "Goodfellas", 0.78),
        (62, "2001 Space Odyssey", 0.55),
    ],
}

# Кожен юзер має 2-4 улюблених кластери
# Кластери мають affinity між собою (хто любить марвел - може любити Нолана)
CLUSTER_AFFINITY = {
    "marvel_mcu": ["nolan_films", "john_wick_franchise", "scifi_modern"],
    "john_wick_franchise": ["marvel_mcu", "thrillers_dark"],
    "nolan_films": ["scifi_modern", "thrillers_dark", "classics"],
    "tarantino": ["thrillers_dark", "classics"],
    "horror_modern": ["thrillers_dark"],
    "ghibli": ["anime_films", "pixar"],
    "anime_films": ["ghibli"],
    "pixar": ["ghibli", "harry_potter"],
    "lotr_hobbit": ["harry_potter", "scifi_modern"],
    "harry_potter": ["lotr_hobbit", "pixar"],
    "romance_classics": ["series_drama", "comedy_modern"],
    "thrillers_dark": ["nolan_films", "tarantino", "horror_modern"],
    "scifi_modern": ["nolan_films", "marvel_mcu"],
    "comedy_modern": ["series_drama", "romance_classics"],
    "korean_wave": ["thrillers_dark", "series_drama"],
    "series_drama": ["classics", "comedy_modern"],
    "classics": ["tarantino", "nolan_films", "series_drama"],
}


def get_all_user_ids(conn):
    cur = conn.cursor()
    placeholders = ','.join(['%s'] * len(PROTECTED_USER_IDS))
    query = f"""
        SELECT id FROM users 
        WHERE account_status = 'active' 
          AND id NOT IN ({placeholders})
        ORDER BY id
    """
    cur.execute(query, tuple(PROTECTED_USER_IDS))
    users = [row[0] for row in cur.fetchall()]
    cur.close()
    return users


def clear_user_data(conn, user_id):
    cur = conn.cursor()
    cur.execute("DELETE FROM user_movie_actions WHERE user_id = %s", (user_id,))
    cur.execute("DELETE FROM user_detailed_ratings WHERE user_id = %s", (user_id,))
    cur.close()


def add_rating(conn, user_id, tmdb_id, rating, is_disliked=False):
    cur = conn.cursor()
    is_favorite = rating >= 9 and not is_disliked
    is_watched = not is_disliked  

    cur.execute("""
        INSERT INTO user_movie_actions 
            (user_id, tmdb_id, is_watched, is_favorite, is_disliked, updated_at)
        VALUES (%s, %s, %s, %s, %s, NOW())
        ON CONFLICT (user_id, tmdb_id) DO UPDATE
        SET is_watched = EXCLUDED.is_watched, 
            is_favorite = EXCLUDED.is_favorite,
            is_disliked = EXCLUDED.is_disliked,
            updated_at = NOW()
    """, (user_id, tmdb_id, is_watched, is_favorite, is_disliked))

    if not is_disliked:
        cur.execute("""
            INSERT INTO user_detailed_ratings (user_id, tmdb_id, overall_rating, updated_at)
            VALUES (%s, %s, %s, NOW())
            ON CONFLICT (user_id, tmdb_id) DO UPDATE
            SET overall_rating = EXCLUDED.overall_rating, updated_at = NOW()
        """, (user_id, tmdb_id, int(rating)))

    cur.close()


def generate_user_taste():
    all_clusters = list(MOVIE_CLUSTERS.keys())

    # 2-4 основних кластери (любить сильно)
    n_primary = random.choice([2, 2, 3, 3, 4])
    primary = random.sample(all_clusters, n_primary)

    # Додаємо afilliated кластери (любить помірно)
    affiliated = set()
    for p in primary:
        for a in CLUSTER_AFFINITY.get(p, []):
            if a not in primary:
                affiliated.add(a)
    affiliated = list(affiliated)[:random.randint(1, 3)]

    # 1-2 кластери які не любить (буде дизлайкати)
    available_disliked = [c for c in all_clusters if c not in primary and c not in affiliated]
    disliked = random.sample(available_disliked, min(random.randint(1, 2), len(available_disliked)))

    return primary, affiliated, disliked


def pick_movies_from_cluster(cluster_name, n, exclude=None):
    exclude = exclude or set()
    movies = [(tid, title, pop) for tid, title, pop in MOVIE_CLUSTERS[cluster_name]
              if tid not in exclude]
    if not movies:
        return []

    selected = []
    movies_copy = movies.copy()
    weights_copy = [pop for _, _, pop in movies_copy]

    for _ in range(min(n, len(movies))):
        if not movies_copy:
            break
        idx = random.choices(range(len(movies_copy)), weights=weights_copy, k=1)[0]
        selected.append(movies_copy.pop(idx))
        weights_copy.pop(idx)

    return selected


if __name__ == "__main__":
    print("=" * 60)
    print("generation of real data")
    print("=" * 60)

    conn = get_connection()
    users = get_all_user_ids(conn)

    print(f"users for processing: {len(users)}")
    if users:
        print(f" First 10 IDs for processing: {users[:10]}")
        print(f" Last 10 IDs for processing: {users[-10:]}")

    confirm = input("\n Old points will be deleted. Continue? (yes/no): ")
    if confirm.lower() != "yes":
        print("Super")
        conn.close()
        exit()

    total = 0
    for user_id in users:
        clear_user_data(conn, user_id)

        primary, affiliated, disliked_clusters = generate_user_taste()
        rated_ids = set()

        for cluster in primary:
            n = random.randint(4, 7)
            picked = pick_movies_from_cluster(cluster, n, rated_ids)
            for tid, title, pop in picked:
                rating = random.choices([7, 8, 8, 9, 9, 9, 10, 10], k=1)[0]
                add_rating(conn, user_id, tid, rating)
                rated_ids.add(tid)
                total += 1

        for cluster in affiliated:
            n = random.randint(2, 4)
            picked = pick_movies_from_cluster(cluster, n, rated_ids)
            for tid, title, pop in picked:
                rating = random.choices([5, 6, 7, 7, 8, 8, 9], k=1)[0]
                add_rating(conn, user_id, tid, rating)
                rated_ids.add(tid)
                total += 1

        if disliked_clusters and random.random() < 0.7:
            cluster = random.choice(disliked_clusters)
            n = random.randint(1, 3)
            picked = pick_movies_from_cluster(cluster, n, rated_ids)
            for tid, title, pop in picked:
                if random.random() < 0.4: 
                    add_rating(conn, user_id, tid, 0, is_disliked=True)
                else:
                    rating = random.choices([1, 2, 3, 4, 5], k=1)[0]
                    add_rating(conn, user_id, tid, rating)
                rated_ids.add(tid)
                total += 1

        # Шум - 2-4 випадкові фільми з будь-яких кластерів
        all_movies = [(tid, t, p) for cluster_movies in MOVIE_CLUSTERS.values()
                      for tid, t, p in cluster_movies if tid not in rated_ids]
        if all_movies:
            noise_count = random.randint(2, 4)
            for tid, title, pop in random.sample(all_movies, min(noise_count, len(all_movies))):
                rating = random.randint(5, 8)
                add_rating(conn, user_id, tid, rating)
                rated_ids.add(tid)
                total += 1

        primary_preview = ", ".join(primary[:2]) + ("..." if len(primary) > 2 else "")
        print(f"User {user_id}: {len(rated_ids)} films (like: {primary_preview})")

    conn.commit()
    conn.close()

    print("\n" + "=" * 60)
    print(f"Ready! Total {total} interactions generated")
