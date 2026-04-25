import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { followsService, FollowingRating } from '../../services/followsService';

const AVATAR_SIZE = 72;

interface Props {
  tmdbId: number;
  onUserPress: (userId: number) => void;
}

export const FollowingRatings: React.FC<Props> = ({ tmdbId, onUserPress }) => {
  const [ratings, setRatings] = useState<FollowingRating[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    followsService.getFollowingRatings(tmdbId)
      .then(data => {
        if (!cancelled) setRatings(data);
      })
      .catch(err => {
        console.error('FollowingRatings load error:', err);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => { cancelled = true; };
  }, [tmdbId]);

  if (!loaded || ratings.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>
        Friends' ratings
        <Text style={styles.count}>  {ratings.length}</Text>
      </Text>
      <FlatList
        data={ratings}
        keyExtractor={item => `following-rating-${item.user_id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onUserPress(item.user_id)}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              {item.profile_image_url ? (
                <Image
                  source={{ uri: item.profile_image_url }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <View style={styles.silhouetteHead} />
                  <View style={styles.silhouetteBody} />
                </View>
              )}
            </View>

            <Text style={styles.username} numberOfLines={1}>
              @{item.username}
            </Text>

            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>⭐ {item.overall_rating}/10</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
  },

  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.white,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  count: {
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    fontSize: 13,
  },

  list: {
    paddingHorizontal: 16,
    gap: 14,
  },

  card: {
    width: AVATAR_SIZE,
    alignItems: 'center',
    gap: 4,
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },

  avatarImg: { width: '100%', height: '100%' },

  avatarPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  silhouetteHead: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#333',
    marginBottom: 2, marginTop: -6,
  },

  silhouetteBody: {
    width: 36, height: 20, borderRadius: 18,
    backgroundColor: '#333',
  },

  username: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.pink,
    marginTop: 6,
    maxWidth: AVATAR_SIZE,
  },

  ratingPill: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },

  ratingText: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    color: COLORS.gold,
  },
});