import pool from './database';

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        uuid CHAR(36) UNIQUE NOT NULL DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        first_name VARCHAR(50),
        last_name VARCHAR(50),
        profile_image_url VARCHAR(500),
        language VARCHAR(2) DEFAULT 'en',
        instagram_username VARCHAR(30),
        telegram_username VARCHAR(30),
        soulmate_consent BOOLEAN DEFAULT FALSE,
        subscription_type VARCHAR(4) DEFAULT 'free',
        account_status VARCHAR(9) DEFAULT 'pending',
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(64),
        verification_token_expires_at TIMESTAMP,
        reset_token VARCHAR(64),
        reset_token_expires_at TIMESTAMP,
        friends_count INT DEFAULT 0,
        followers_count INT DEFAULT 0,
        following_count INT DEFAULT 0,
        movies_watched INT DEFAULT 0,
        series_watched INT DEFAULT 0,
        episodes_watched BIGINT DEFAULT 0,
        custom_lists_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active_at TIMESTAMP,
        subscription_ends_at TIMESTAMP
      );
    `);
    console.log('Table users ready');

    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS verification_token VARCHAR(64),
        ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(64),
        ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP;
    `);
    console.log('Email verification + reset columns ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_lists (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        list_type VARCHAR(10) NOT NULL CHECK (list_type IN ('favorites', 'watched', 'watchlist', 'custom')),
        name VARCHAR(30),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table user_lists ready');

    await pool.query(`
      ALTER TABLE user_lists
        ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
    `);
    console.log('is_private column ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS list_items (
        id         BIGSERIAL PRIMARY KEY,
        list_id    BIGINT NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
        tmdb_id    BIGINT NOT NULL,
        media_type VARCHAR(5) NOT NULL DEFAULT 'movie' CHECK (media_type IN ('movie', 'tv')),
        added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (list_id, tmdb_id, media_type)
      );
    `);
    console.log('Table list_items ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_movie_actions (
        id           BIGSERIAL PRIMARY KEY,
        user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id      BIGINT NOT NULL,
        is_favorite  BOOLEAN DEFAULT FALSE,
        is_watchlist BOOLEAN DEFAULT FALSE,
        is_watched   BOOLEAN DEFAULT FALSE,
        is_disliked  BOOLEAN DEFAULT FALSE,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, tmdb_id)
      );
    `);
    console.log('Table user_movie_actions ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_detailed_ratings (
        id             BIGSERIAL PRIMARY KEY,
        user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id        BIGINT NOT NULL,
        overall_rating SMALLINT CHECK (overall_rating BETWEEN 1 AND 10),
        director_score SMALLINT CHECK (director_score BETWEEN 1 AND 5),
        effects_score  SMALLINT CHECK (effects_score BETWEEN 1 AND 5),
        script_score   SMALLINT CHECK (script_score BETWEEN 1 AND 5),
        music_score    SMALLINT CHECK (music_score BETWEEN 1 AND 5),
        acting_score   SMALLINT CHECK (acting_score BETWEEN 1 AND 5),
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, tmdb_id)
      );
    `);
    console.log('Table user_detailed_ratings ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_movie_moods (
        id         BIGSERIAL PRIMARY KEY,
        user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id    BIGINT NOT NULL,
        mood       VARCHAR(20) NOT NULL CHECK (
          mood IN ('happy','inspired','scared','sad','thoughtful',
                   'bored','excited','romantic','angry','relaxed')
        ),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, tmdb_id)
      );
    `);
    console.log('Table user_movie_moods ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id             BIGSERIAL PRIMARY KEY,
        user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id        BIGINT NOT NULL,
        comment_text   VARCHAR(500) NOT NULL,
        is_anonymous   BOOLEAN DEFAULT FALSE,
        has_spoiler    BOOLEAN DEFAULT FALSE,
        likes_count    INT DEFAULT 0,
        dislikes_count INT DEFAULT 0,
        is_edited      BOOLEAN DEFAULT FALSE,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table comments ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id         BIGSERIAL PRIMARY KEY,
        user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        comment_id BIGINT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
        is_like    BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, comment_id)
      );
    `);
    console.log('Table comment_likes ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_best_actor_votes (
        id            BIGSERIAL PRIMARY KEY,
        user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id       BIGINT NOT NULL,
        actor_tmdb_id BIGINT NOT NULL,
        actor_name    VARCHAR(100) NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, tmdb_id)
      );
    `);
    console.log('Table user_best_actor_votes ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id BIGSERIAL PRIMARY KEY,
        follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (follower_id, following_id),
        CHECK (follower_id <> following_id)
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
    `);
    console.log('Table user_follows ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_soulmate_matches (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        matched_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wrapped_year INT NOT NULL,
        similarity_score DECIMAL(5,4) NOT NULL,
        rating_similarity DECIMAL(5,4) DEFAULT 0,
        genre_similarity DECIMAL(5,4) DEFAULT 0,
        actor_similarity DECIMAL(5,4) DEFAULT 0,
        mood_similarity DECIMAL(5,4) DEFAULT 0,
        director_similarity DECIMAL(5,4) DEFAULT 0,
        disliked_similarity DECIMAL(5,4) DEFAULT 0,
        shared_movies_count INT DEFAULT 0,
        top_shared_movies BIGINT[] DEFAULT '{}',
        shared_genres TEXT[] DEFAULT '{}',
        shared_disliked BIGINT[] DEFAULT '{}',
        computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (user_id, wrapped_year),
        CHECK (user_id <> matched_user_id)
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_soulmate_user_year
        ON user_soulmate_matches(user_id, wrapped_year);
    `);
    console.log('Table user_soulmate_matches ready');

    // у мене ця таблиця заповнюється під час дії юзера (наприклад, коли він позначає фільм як 'watched' або ставить рейтинг)
    // і потім використовується для обрахунку аналітики в Wrapped, щоб не робити багато запитів до TMDB API в момент генерації Wrapped
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tmdb_media_cache (
        tmdb_id BIGINT NOT NULL,
        media_type VARCHAR(5) NOT NULL CHECK (media_type IN ('movie', 'tv')),
        title VARCHAR(255),
        release_year INT,
        runtime_minutes INT,
        episode_runtime_minutes INT,
        poster_path VARCHAR(255),
        genre_ids INT[] DEFAULT '{}',
        director_tmdb_id INT,
        director_name VARCHAR(100),
        top_cast JSONB DEFAULT '[]',
        cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (tmdb_id, media_type)
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tmdb_cache_director
        ON tmdb_media_cache(director_tmdb_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tmdb_cache_release_year
        ON tmdb_media_cache(release_year);
    `);
    console.log('Table tmdb_media_cache ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_wrapped_summary (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wrapped_year INT NOT NULL,
        total_minutes INT DEFAULT 0,
        total_hours INT DEFAULT 0,
        total_days DECIMAL(5,1) DEFAULT 0,
        avg_release_year DECIMAL(6,1),
        cinema_age INT,
        movies_count INT DEFAULT 0,
        series_count INT DEFAULT 0,
        episodes_count INT DEFAULT 0,
        top_genre_id INT,
        top_genre_name VARCHAR(50),
        top_director_id INT,
        top_director_name VARCHAR(100),
        top_actors JSONB DEFAULT '[]',
        top_movie_tmdb_id BIGINT,
        top_movie_title VARCHAR(255),
        top_movie_poster VARCHAR(255),
        top_movie_rating SMALLINT,
        top_mood VARCHAR(20),
        mood_count INT DEFAULT 0,
        top_weekday SMALLINT,
        top_hour SMALLINT,
        top_month SMALLINT,
        topfan_actor_id INT,
        topfan_actor_name VARCHAR(100),
        topfan_minutes INT DEFAULT 0,
        topfan_percentile DECIMAL(5,2),
        computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, wrapped_year)
      );
    `);

    await pool.query(`
      ALTER TABLE user_wrapped_summary
        ADD COLUMN IF NOT EXISTS cinema_vibe VARCHAR(50),
        ADD COLUMN IF NOT EXISTS cinema_vibe_stat VARCHAR(200);
    `);
    console.log('Wrapped: cinema_vibe columns added');

    await pool.query(`
      ALTER TABLE user_wrapped_summary
        DROP COLUMN IF EXISTS topfan_series_count;
    `);
    console.log('Wrapped: topfan_series_count removed');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_wrapped_user_year
        ON user_wrapped_summary(user_id, wrapped_year);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_wrapped_year_computed
        ON user_wrapped_summary(wrapped_year, computed_at);
    `);
    console.log('Table user_wrapped_summary ready');


    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_ai_recommendations (
        id           BIGSERIAL PRIMARY KEY,
        user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        recommendations JSONB NOT NULL,
        model_used   VARCHAR(50) NOT NULL,
        watched_count INT NOT NULL,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at   TIMESTAMP NOT NULL
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ai_recs_user_expires
        ON user_ai_recommendations(user_id, expires_at DESC);
    `);
    console.log('Table user_ai_recommendations ready');

    console.log('Converting tmdb_id columns to BIGINT...');

    await pool.query(`ALTER TABLE list_items ALTER COLUMN tmdb_id TYPE BIGINT;`);
    await pool.query(`ALTER TABLE user_movie_actions ALTER COLUMN tmdb_id TYPE BIGINT;`);
    await pool.query(`ALTER TABLE user_detailed_ratings ALTER COLUMN tmdb_id TYPE BIGINT;`);
    await pool.query(`ALTER TABLE user_movie_moods ALTER COLUMN tmdb_id TYPE BIGINT;`);
    await pool.query(`ALTER TABLE comments ALTER COLUMN tmdb_id TYPE BIGINT;`);
    await pool.query(`ALTER TABLE user_best_actor_votes ALTER COLUMN tmdb_id TYPE BIGINT;`);

    console.log('All tmdb_id columns successfully converted to BIGINT');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS onboarding_actors (
        id SERIAL PRIMARY KEY,
        tmdb_id INT NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        photo_path VARCHAR(255) NOT NULL,
        known_for VARCHAR(255)
      );
    `);
    console.log('Table onboarding_actors ready');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS onboarding_movies (
        id SERIAL PRIMARY KEY,
        tmdb_id INT NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        poster_path VARCHAR(255) NOT NULL,
        year SMALLINT NOT NULL,
        genre VARCHAR(50) NOT NULL,
        batch SMALLINT NOT NULL DEFAULT 1
      );
    `);
    console.log('Table onboarding_movies ready');

    await pool.query(`
      INSERT INTO onboarding_actors (tmdb_id, name, photo_path, known_for) VALUES
        (31,      'Tom Hanks',          '/oFvZoKI6lvU03n4YoNGAll9rkas.jpg', 'Forrest Gump, Cast Away'), 
        (18918,   'Dwayne Johnson',     '/5QApZVV8FUFlVxQpIK3Ew6cqotq.jpg', 'Fast & Furious, Jumanji'),
        (6193,    'Leonardo DiCaprio',  '/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg', 'Titanic, Inception'),
        (5064,    'Meryl Streep',       '/g5cVxQBAQ3AXt3LhdBXtbbN47Uc.jpg', 'The Devil Wears Prada'),
        (1245,    'Scarlett Johansson', '/6NsMbJXRlDZuDzatN2akFdGuTvx.jpg', 'Black Widow, Marriage Story'),
        (2963,    'Brad Pitt',          '/kU3B75TyRiCgE270EyZnHjfivoq.jpg', 'Fight Club, Once Upon a Time'),
        (1136406, 'Timothee Chalamet',  '/BE2sdjpgsa2rNTFa66f7upkaOP.jpg',  'Dune, Call Me by Your Name'),
        (3223,    'Robert Downey Jr.',  '/im9SAqJPZKEbVZGmjXuLI4O7RvM.jpg', 'Iron Man, Avengers'),
        (112,   'Cate Blanchett',     '/vUuEHiAR0eD3XEJhg2DWIjymUAA.jpg', 'Carol, Tar'),
        (505710,   'Zendaya',            '/uD5a0CsVbR0phlUvHXLlKntAIXS.jpg', 'Euphoria, Dune'),
        (10990,   'Ryan Gosling',       '/lyUyVARQKhGxaxy0FbPJCQRpiaW.jpg', 'La La Land, Barbie'),
        (524,    'Natalie Portman',    '/edPU5HxncLWa1YkgRPNkSd68ONG.jpg', 'Black Swan, Leon'),
        (234352,  'Margot Robbie',      '/euDPyqLnuwaWMHajcU3oZ9uZezR.jpg', 'Barbie, The Wolf of Wall Street'),
        (206,     'Jim Carrey',         '/y3U9QfPN6sJaGl6l68xjwWj28ig.jpg', 'The Mask, Eternal Sunshine'),
        (54693,   'Emma Stone',         '/cZ8a3QvAnj2cgcgVL6g4XaqPzpL.jpg', 'La La Land, Poor Things'),
        (3894,    'Christian Bale',     '/qCpZn2e3dimwbryLnqxZuI88PTi.jpg', 'The Dark Knight, The Prestige'),
        (500,     'Tom Cruise',         '/p17SLq4wabXwIYyjXF1Wf5cNnAm.jpg', 'Mission Impossible, Top Gun'),
        (224513, 'Ana de Armas',       '/tkBWBvcLTihUcVf6iwbMQTFqEEv.jpg', 'Knives Out, Blonde'),
        (5292,    'Denzel Washington',  '/jj2Gcobpopokal0YstuCQW0ldJ4.jpg', 'Training Day, Malcolm X'),
        (19492,   'Viola Davis',        '/xDssw6vpYNRjsybvMPRE30e0dPN.jpg', 'The Help, How to Get Away with Murder')
      ON CONFLICT (tmdb_id) DO UPDATE SET
        photo_path = EXCLUDED.photo_path,
        name = EXCLUDED.name,
        known_for = EXCLUDED.known_for;
    `);
    console.log('Onboarding actors updated to 20');

    await pool.query(`
      INSERT INTO onboarding_movies (tmdb_id, title, poster_path, year, genre, batch) VALUES
        (238,    'The Godfather',            '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', 1972, 'Drama',     1),
        (13,     'Forrest Gump',             '/Cw4hIUIAmSYfK9QfaUW5igp9La.jpg', 1994, 'Drama',     1),
        (680,    'Pulp Fiction',             '/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg', 1994, 'Thriller',  1),
        (597,    'Titanic',                  '/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg', 1997, 'Romance',   1),
        (155,    'The Dark Knight',          '/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 2008, 'Action',    1),
        (19995,  'Avatar',                   '/gKY6q7SjCkAU6FqvqWybDYgUKIF.jpg', 2009, 'Sci-Fi',   1),
        (129,    'Spirited Away',            '/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg', 2001, 'Anime',     1),
        (4935,   'Howls Moving Castle',      '/13kOl2v0nD2OLbVSHnHk8GUFEhO.jpg', 2004, 'Anime',     1),
        (98,     'Gladiator',                '/wN2xWp1eIwCKOD0BHTcErTBv1Uq.jpg', 2000, 'Action',    1),
        (857,    'Saving Private Ryan',      '/uqx37cS8cpHg8U35f9U5IBlrCV3.jpg', 1998, 'Drama',     1),
        (9806,   'The Incredibles',          '/2LqaLgk4Z226KkgPJuiOQ58wvrm.jpg', 2004, 'Animation', 1),
        (920,    'Cars',                     '/2Touk3m5gzsqr1VsvxypdyHY5ci.jpg', 2006, 'Animation', 1),
        (585,    'Monsters Inc',             '/wFSpyMsp7H0ttERbxY7Trlv8xry.jpg', 2001, 'Animation', 1),
        (372058, 'Your Name',                '/q719jXXEzOoYaps6babgKnONONX.jpg', 2016, 'Anime',     1),
        (635302, 'Demon Slayer Mugen Train', '/h8Rb9gBr48ODIwYUttZNYeMWeUU.jpg', 2020, 'Anime',     1),
        (496243, 'Parasite',                 '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg', 2019, 'Thriller',  1),
        (313369,    'La La Land',               '/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg', 2016, 'Romance',   1),
        (475557, 'Joker',                    '/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg', 2019, 'Drama',     1),
        (105,    'Back to the Future',       '/vN5B5WgYscRGcQpVhHl6p9DDTP0.jpg', 1985, 'Sci-Fi',   2),
        (120,    'The Lord of the Rings',    '/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', 2001, 'Fantasy',   2),
        (424,    'Schindlers List',          '/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg', 1993, 'Drama',     2),
        (1894,     'Star Wars',                '/6wkfovpn7Eq8dYNKaG5PY3q2oq6.jpg', 2002, 'Sci-Fi',   2),
        (694,    'The Shining',              '/uAR0AWqhQL1hQa69UDEbb2rE5Wx.jpg', 1980, 'Horror',    2),
        (769,    'GoodFellas',               '/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg', 1990, 'Crime',     2),
        (557,    'Spider-Man',               '/kjdJntyBeEvqm9w97QGBdxPptzj.jpg', 2002, 'Action',    2),
        (37165,  'The Truman Show',          '/vuza0WqY239yBXOadKlGwJsZJFE.jpg', 1998, 'Drama',     2),
        (9054,   'Amelie',                   '/nSxDa3M9aMvGVLoItzWTepQ5h5d.jpg', 2001, 'Romance',   2),
        (128,    'Princess Mononoke',        '/cMYCDADoLKLbB83g4WnJegaZimC.jpg', 1997, 'Anime',     2),
        (508439, 'Soul',                     '/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg', 2020, 'Animation', 2),
        (301528, 'Toy Story 4',              '/w9kR8qbmQ01HwnvK4alvnQ2ca0L.jpg', 2019, 'Animation', 2),
        (274,    'The Silence of the Lambs', '/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg', 1991, 'Thriller',  2),
        (489,    'Good Will Hunting',        '/bABCBKYBK7A5G1x0FzoeoNfuj2.jpg',  1997, 'Drama',     2),
        (539,    'Psycho',                   '/yz4QVqPx3h1hD1DfqqQkCq3rmxW.jpg', 1960, 'Horror',    2),
        (1891,   'The Empire Strikes Back',  '/2l05cFWJacyIsTpsqSgH0wQXe4V.jpg', 1980, 'Sci-Fi',   2),
        (550,    'Fight Club',               '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', 1999, 'Thriller',  2)
      ON CONFLICT (tmdb_id) DO UPDATE SET
        poster_path = EXCLUDED.poster_path,
        title = EXCLUDED.title,
        genre = EXCLUDED.genre,
        batch = EXCLUDED.batch;
    `);
    console.log('Onboarding movies updated');

    await pool.query(`
      DELETE FROM onboarding_movies
      WHERE tmdb_id IN (962796, 765285, 882569, 614917, 1891)
        AND tmdb_id NOT IN (
          SELECT unnest(ARRAY[238,13,680,597,155,19995,129,4935,98,857,9806,920,585,
                              372058,149870,496243,637,475557,105,120,424,11,694,769,
                              558,37165,9054,128,512244,508439,301528,274,489,539,1891,550])
        );
    `);
    console.log('Onboarding stale movies removed');

    await pool.query(`
      ALTER TABLE onboarding_movies
        ADD COLUMN IF NOT EXISTS media_type VARCHAR(5) NOT NULL DEFAULT 'movie'
        CHECK (media_type IN ('movie', 'tv'));
    `);
    console.log('onboarding_movies: media_type column added');

    await pool.query(`
      INSERT INTO onboarding_movies (tmdb_id, title, poster_path, year, genre, batch, media_type) VALUES
        (117378, 'Mouse', '/qz0axqEwwIa5uaMsUYKGs9u29ut.jpg', 2021, 'K-Drama', 1, 'tv'),
        (154825, 'Business Proposal', '/iLh7L8ZuvgdxFaM9sImyv2iKYLe.jpg', 2022, 'K-Drama', 1, 'tv'),
        (1396, 'Breaking Bad', '/ztkUQFLlC19CCMYHW9o1zWhJRNq.jpg', 2008, 'Series',  2, 'tv'),
        (1399, 'Game of Thrones', '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', 2011, 'Series',  1, 'tv'),
        (1668, 'Friends', '/2koX1xLkpTQM4IZebYvKysFW1Nh.jpg', 1994, 'Series',  1, 'tv'),
        (18165, 'The Vampire Diaries', '/b3vl6wV1W8PBezFfntKTrhrehCY.jpg', 2009, 'Series',  2, 'tv')
      ON CONFLICT (tmdb_id) DO UPDATE SET
        poster_path = EXCLUDED.poster_path,
        media_type = EXCLUDED.media_type;
    `);
    console.log('Onboarding TV shows seeded');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_onboarding (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
        liked_actor_ids  INT[] NOT NULL DEFAULT '{}',
        watched_tmdb_ids INT[] NOT NULL DEFAULT '{}',
        ratings JSONB NOT NULL DEFAULT '{}',
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_onboarding_user
        ON user_onboarding(user_id);
    `);
    console.log('Table user_onboarding ready');

    await pool.query(`
      ALTER TABLE tmdb_media_cache 
        ADD COLUMN IF NOT EXISTS vote_average DECIMAL(4,2) DEFAULT 0;
    `);
    console.log('vote_average column ready');    
    console.log('All tables created successfully');

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
};

createTables();