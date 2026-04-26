import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../../constants/colors';
import { POSTER_SIZES } from '../../../constants/tmdb';
import { followsService } from '../../../services/followsService';
import { tmdbMovieService } from '../../../services/tmdbMovieService';
import { tmdbSeriesService } from '../../../services/tmdbSeriesService';
import { styles, GRID_CONFIG } from './PublicListGrid.styles';

interface MediaMeta {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
}

interface Props {
  userId: number;
  listId: number | null;
  listType: string;
  onItemPress: (tmdbId: number, mediaType: 'movie' | 'tv') => void;
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

      const metas = await Promise.allSettled(
        sliced.map(async (i): Promise<MediaMeta> => {
          if (i.media_type === 'tv') {
            const d = await tmdbSeriesService.getSeriesDetails(i.tmdb_id);
            return {
              tmdb_id: d.id,
              title: d.name,
              poster_path: d.poster_path,
              release_date: d.first_air_date,
              vote_average: d.vote_average,
              media_type: 'tv',
            };
          } else {
            const d = await tmdbMovieService.getMovieDetails(i.tmdb_id);
            return {
              tmdb_id: d.id,
              title: d.title,
              poster_path: d.poster_path,
              release_date: d.release_date,
              vote_average: d.vote_average,
              media_type: 'movie',
            };
          }
        })
      );

      const loaded: MediaMeta[] = metas.map((r, idx) => {
        if (r.status === 'fulfilled') return r.value;
        return {
          tmdb_id: sliced[idx].tmdb_id,
          title: 'Unknown',
          poster_path: null,
          release_date: '',
          vote_average: 0,
          media_type: sliced[idx].media_type as 'movie' | 'tv',
        };
      });

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