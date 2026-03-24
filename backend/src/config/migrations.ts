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

    console.log('All tables created successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
};

createTables();