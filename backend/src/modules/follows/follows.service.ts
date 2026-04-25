import pool from '../../config/database';
import { PublicUserProfile, UserListItem, FollowStatus, FollowCounts } from './follows.types';

const PUBLIC_USER_FIELDS = `
  u.id, u.uuid, u.username, u.first_name, u.last_name, u.profile_image_url,
  u.friends_count, u.followers_count, u.following_count,
  u.movies_watched, u.series_watched, u.episodes_watched
`;

const recomputeCounts = async (userId: number): Promise<void> => {
  await pool.query(
    `UPDATE users SET
       followers_count = (SELECT COUNT(*) FROM user_follows WHERE following_id = $1),
       following_count = (SELECT COUNT(*) FROM user_follows WHERE follower_id  = $1),
       friends_count = (
         SELECT COUNT(*) FROM user_follows f1
         WHERE f1.follower_id = $1
           AND EXISTS (
             SELECT 1 FROM user_follows f2
             WHERE f2.follower_id = f1.following_id
               AND f2.following_id = $1
           )
       )
     WHERE id = $1`,
    [userId]
  );
};

export const followUser = async (
  followerId: number, targetUserId: number
): Promise<FollowCounts> => {
  if (followerId === targetUserId) throw new Error('Cannot follow yourself');

  const target = await pool.query(
    `SELECT id FROM users WHERE id = $1 AND account_status = 'active'`,
    [targetUserId]
  );
  if (target.rows.length === 0) throw new Error('User not found');

  await pool.query(
    `INSERT INTO user_follows (follower_id, following_id)
     VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [followerId, targetUserId]
  );

  await recomputeCounts(followerId);
  await recomputeCounts(targetUserId);

  return getMyCounts(followerId);
};

export const unfollowUser = async (
  followerId: number, targetUserId: number
): Promise<FollowCounts> => {
  await pool.query(
    `DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
    [followerId, targetUserId]
  );

  await recomputeCounts(followerId);
  await recomputeCounts(targetUserId);

  return getMyCounts(followerId);
};

export const getFollowers = async (
  targetUserId: number, viewerId: number
): Promise<UserListItem[]> => {
  const result = await pool.query(
    `SELECT ${PUBLIC_USER_FIELDS},
       EXISTS (
         SELECT 1 FROM user_follows vf
         WHERE vf.follower_id = $2 AND vf.following_id = u.id
       ) AS is_followed_by_me
     FROM user_follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id = $1 AND u.account_status = 'active'
     ORDER BY f.created_at DESC`,
    [targetUserId, viewerId]
  );
  return result.rows;
};

export const getFollowing = async (
  targetUserId: number, viewerId: number
): Promise<UserListItem[]> => {
  const result = await pool.query(
    `SELECT ${PUBLIC_USER_FIELDS},
       EXISTS (
         SELECT 1 FROM user_follows vf
         WHERE vf.follower_id = $2 AND vf.following_id = u.id
       ) AS is_followed_by_me
     FROM user_follows f
     JOIN users u ON u.id = f.following_id
     WHERE f.follower_id = $1 AND u.account_status = 'active'
     ORDER BY f.created_at DESC`,
    [targetUserId, viewerId]
  );
  return result.rows;
};

export const getFriends = async (
  targetUserId: number, viewerId: number
): Promise<UserListItem[]> => {
  const result = await pool.query(
    `SELECT ${PUBLIC_USER_FIELDS},
       EXISTS (
         SELECT 1 FROM user_follows vf
         WHERE vf.follower_id = $2 AND vf.following_id = u.id
       ) AS is_followed_by_me
     FROM user_follows f1
     JOIN user_follows f2
       ON f2.follower_id = f1.following_id AND f2.following_id = f1.follower_id
     JOIN users u ON u.id = f1.following_id
     WHERE f1.follower_id = $1 AND u.account_status = 'active'
     ORDER BY f1.created_at DESC`,
    [targetUserId, viewerId]
  );
  return result.rows;
};

export const getFollowStatus = async (
  viewerId: number, targetUserId: number
): Promise<FollowStatus> => {
  if (viewerId === targetUserId) {
    return { is_following: false, is_followed_by: false, is_friend: false };
  }

  const result = await pool.query(
    `SELECT
       EXISTS (SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2) AS is_following,
       EXISTS (SELECT 1 FROM user_follows WHERE follower_id = $2 AND following_id = $1) AS is_followed_by`,
    [viewerId, targetUserId]
  );
  const row = result.rows[0];
  return {
    is_following: row.is_following,
    is_followed_by: row.is_followed_by,
    is_friend: row.is_following && row.is_followed_by,
  };
};

export const getMyCounts = async (userId: number): Promise<FollowCounts> => {
  const result = await pool.query(
    `SELECT friends_count, followers_count, following_count FROM users WHERE id = $1`,
    [userId]
  );
  return result.rows[0] ?? { friends_count: 0, followers_count: 0, following_count: 0 };
};

export const getPublicProfile = async (
  viewerId: number, targetUserId: number
): Promise<(PublicUserProfile & FollowStatus & {
  telegram_username: string | null;
  instagram_username: string | null;
  created_at: Date;
}) | null> => {
  const result = await pool.query(
    `SELECT ${PUBLIC_USER_FIELDS},
            u.telegram_username, u.instagram_username, u.created_at
     FROM users u WHERE u.id = $1 AND u.account_status = 'active'`,
    [targetUserId]
  );
  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const status = await getFollowStatus(viewerId, targetUserId);
  const canSeeSocials = status.is_friend;

  return {
    id: row.id,
    uuid: row.uuid,
    username: row.username,
    first_name: row.first_name,
    last_name: row.last_name,
    profile_image_url: row.profile_image_url,
    friends_count: row.friends_count,
    followers_count: row.followers_count,
    following_count: row.following_count,
    movies_watched: row.movies_watched,
    series_watched: row.series_watched,
    episodes_watched: row.episodes_watched,
    telegram_username:  canSeeSocials ? row.telegram_username  : null,
    instagram_username: canSeeSocials ? row.instagram_username : null,
    created_at: row.created_at,
    ...status,
  };
};

export const searchUsers = async (
  viewerId: number, query: string, limit = 20
): Promise<UserListItem[]> => {
  const q = `%${query.trim().toLowerCase()}%`;

  const result = await pool.query(
    `SELECT ${PUBLIC_USER_FIELDS},
       EXISTS (
         SELECT 1 FROM user_follows vf
         WHERE vf.follower_id = $1 AND vf.following_id = u.id
       ) AS is_followed_by_me
     FROM users u
     WHERE u.account_status = 'active'
       AND u.id <> $1
       AND (
         LOWER(u.username)   LIKE $2
         OR LOWER(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) LIKE $2
       )
     ORDER BY u.followers_count DESC, u.username ASC
     LIMIT $3`,
    [viewerId, q, limit]
  );
  return result.rows;
};

export interface PublicListSummary {
  id: number;
  list_type: 'watched' | 'favorites' | 'watchlist' | 'custom';
  name: string;
  is_private: boolean;
  items_count: number;
}

export const getUserLists = async (targetUserId: number): Promise<PublicListSummary[]> => {
  const userCheck = await pool.query(
    `SELECT id FROM users WHERE id = $1 AND account_status = 'active'`,
    [targetUserId]
  );
  if (userCheck.rows.length === 0) throw new Error('User not found');

  const result = await pool.query(
    `SELECT
       ul.id, ul.list_type, ul.name, ul.is_private,
       COALESCE(COUNT(li.id), 0)::int AS items_count
     FROM user_lists ul
     LEFT JOIN list_items li ON li.list_id = ul.id
     WHERE ul.user_id = $1
       AND (ul.list_type IN ('watched', 'favorites', 'watchlist') OR ul.is_private = FALSE)
     GROUP BY ul.id
     ORDER BY ul.created_at ASC`,
    [targetUserId]
  );
  return result.rows;
};

export const getUserListItems = async (
  targetUserId: number, listId: number
): Promise<{ tmdb_id: number; media_type: string; added_at: Date }[]> => {
  const listCheck = await pool.query(
    `SELECT id FROM user_lists
     WHERE id = $1 AND user_id = $2
       AND (list_type IN ('watched', 'favorites', 'watchlist') OR is_private = FALSE)`,
    [listId, targetUserId]
  );
  if (listCheck.rows.length === 0) throw new Error('List not found or private');

  const result = await pool.query(
    `SELECT tmdb_id, media_type, added_at
     FROM list_items WHERE list_id = $1
     ORDER BY added_at DESC`,
    [listId]
  );
  return result.rows;
};

export interface FollowingRating {
  user_id: number;
  username: string;
  profile_image_url: string | null;
  overall_rating: number;   
  rated_at: Date;
}

export const getFollowingRatingsForMedia = async (
  viewerId: number, tmdbId: number
): Promise<FollowingRating[]> => {
  const result = await pool.query(
    `SELECT
       u.id AS user_id,
       u.username,
       u.profile_image_url,
       udr.overall_rating,
       udr.updated_at AS rated_at
     FROM user_detailed_ratings udr
     JOIN user_follows uf ON uf.following_id = udr.user_id AND uf.follower_id = $1
     JOIN users u ON u.id = udr.user_id AND u.account_status = 'active'
     WHERE udr.tmdb_id = $2
       AND udr.overall_rating IS NOT NULL
     ORDER BY udr.updated_at DESC`,
    [viewerId, tmdbId]
  );
  return result.rows;
};