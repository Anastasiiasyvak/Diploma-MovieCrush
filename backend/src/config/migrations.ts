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


    await pool.query(`DROP TABLE IF EXISTS comment_likes CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS comments CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS user_best_actor_votes CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS user_movie_moods CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS user_detailed_ratings CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS user_movie_actions CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS list_items CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS user_yearly_stats CASCADE;`);
    console.log('Old new tables dropped');

    await pool.query(`
      CREATE TABLE list_items (
        id         BIGSERIAL PRIMARY KEY,
        list_id    BIGINT NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
        tmdb_id    INT NOT NULL,
        media_type VARCHAR(5) NOT NULL DEFAULT 'movie' CHECK (media_type IN ('movie', 'tv')),
        added_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (list_id, tmdb_id, media_type)
      );
    `);
    console.log('Table list_items ready');

    await pool.query(`
      CREATE TABLE user_movie_actions (
        id           BIGSERIAL PRIMARY KEY,
        user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id      INT NOT NULL,
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
      CREATE TABLE user_detailed_ratings (
        id             BIGSERIAL PRIMARY KEY,
        user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id        INT NOT NULL,
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
      CREATE TABLE user_movie_moods (
        id         BIGSERIAL PRIMARY KEY,
        user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id    INT NOT NULL,
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
      CREATE TABLE comments (
        id             BIGSERIAL PRIMARY KEY,
        user_id        BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id        INT NOT NULL,
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
      CREATE TABLE comment_likes (
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
      CREATE TABLE user_best_actor_votes (
        id            BIGSERIAL PRIMARY KEY,
        user_id       BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tmdb_id       INT NOT NULL,
        actor_tmdb_id INT NOT NULL,
        actor_name    VARCHAR(100) NOT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, tmdb_id)
      );
    `);
    console.log('Table user_best_actor_votes ready');

    await pool.query(`
      CREATE TABLE user_yearly_stats (
        id                   BIGSERIAL PRIMARY KEY,
        user_id              BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        year                 INT NOT NULL,
        movies_watched       INT DEFAULT 0,
        series_watched       INT DEFAULT 0,
        episodes_watched     INT DEFAULT 0,
        total_hours          DECIMAL(6,1) DEFAULT 0.0,
        top_director_tmdb_id INT,
        top_director_name    VARCHAR(100),
        top_genre_id         INT,
        top_genre_name       VARCHAR(50),
        top_actor_1_tmdb_id  INT,
        top_actor_1_name     VARCHAR(100),
        top_actor_2_tmdb_id  INT,
        top_actor_2_name     VARCHAR(100),
        top_actor_3_tmdb_id  INT,
        top_actor_3_name     VARCHAR(100),
        favorite_movie_tmdb_id INT,
        favorite_movie_title   VARCHAR(255),
        most_watched_month     SMALLINT CHECK (most_watched_month BETWEEN 1 AND 12),
        average_rating         DECIMAL(3,1) DEFAULT 0.0,
        total_reviews          INT DEFAULT 0,
        created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, year)
      );
    `);
    console.log('Table user_yearly_stats ready');

    console.log('All tables created successfully');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
};

createTables();