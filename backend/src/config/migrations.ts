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
        account_status VARCHAR(9) DEFAULT 'active',
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
    console.log('Table users created');
    console.log('All tables created successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
};

createTables();