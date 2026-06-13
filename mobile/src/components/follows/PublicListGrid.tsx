import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { POSTER_SIZES } from '../../constants/tmdb';
import { followsService } from '../../services/followsService';
import { movieService } from '../../services/movieService';
import { styles, GRID_CONFIG } from './PublicListGrid.styles';
import { MediaType } from '../../types/tmdb.types';

interface MediaMeta {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  media_type: MediaType;
}

interface Props {
  userId: number;
  listId: number | null;
  listType: string;
  onItemPress: (tmdbId: number, mediaType: MediaType) => void;
}

export const PublicListGrid: React.FC<Props> = ({ userId, listId, listType, onItemPress }) => {
  const [items, setItems] = useState<MediaMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (listId === null) { setItems([]); setLoading(false); return; }
    load();
  }, [listId, userId]);

  const load = async () => {
    if (!listId) return;
    setLoading(true);
    try {
      const data = await followsService.getUserListItems(userId, listId);
      const sliced = data.slice(0, 30);

      const batch = await movieService.getBatchDetails(
        sliced.map(i => ({
          tmdb_id: i.tmdb_id,
          media_type: (i.media_type as MediaType) ?? 'movie',
        })),
      );

      const loaded: MediaMeta[] = batch
        .filter((m): m is MediaMeta => m.title !== null)
        .map(m => ({
          tmdb_id: m.tmdb_id,
          title: m.title as string,
          poster_path: m.poster_path,
          release_date: m.release_date,
          vote_average: m.vote_average,
          media_type: m.media_type,
        }));

      setItems(loaded);
    } catch (e) {
      console.error('PublicListGrid load error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color={COLORS.gold} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          {listType === 'watched' ? 'Nothing watched yet' :
           listType === 'favorites' ? 'No favorites yet' :
           listType === 'watchlist' ? 'Watchlist is empty' :
           'This list is empty'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {items.map((m, index) => {
        const posterUrl = m.poster_path ? `${POSTER_SIZES.medium}${m.poster_path}` : null;
        const marginLeft = index % GRID_CONFIG.COLS !== 0 ? GRID_CONFIG.CARD_GAP : 0;

        return (
          <TouchableOpacity
            key={`${m.media_type}-${m.tmdb_id}`}
            style={[styles.card, { marginLeft }]}
            activeOpacity={0.8}
            onPress={() => onItemPress(m.tmdb_id, m.media_type)}
          >
            <View style={styles.posterWrap}>
              {posterUrl ? (
                <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" />
              ) : (
                <View style={styles.posterPlaceholder}>
                  <Text style={styles.placeholderIcon}>
                    {m.media_type === 'tv' ? '📺' : '🎬'}
                  </Text>
                </View>
              )}

              {m.vote_average > 0 && (
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {m.vote_average.toFixed(1)}</Text>
                </View>
              )}

              <View style={[
                styles.typeBadge,
                m.media_type === 'tv' && styles.typeBadgeTv,
              ]}>
                <Text style={styles.typeText}>
                  {m.media_type === 'tv' ? 'Series' : 'Movie'}
                </Text>
              </View>
            </View>

            <Text style={styles.title} numberOfLines={2}>{m.title}</Text>
            <Text style={styles.year}>{m.release_date?.slice(0, 4) ?? '—'}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};