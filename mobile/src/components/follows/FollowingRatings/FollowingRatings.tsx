import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity,
} from 'react-native';
import { followsService, FollowingRating } from '../../../services/followsService';
import { styles } from './FollowingRatings.styles';

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