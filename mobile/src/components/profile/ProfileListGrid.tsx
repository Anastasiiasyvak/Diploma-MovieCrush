import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { POSTER_SIZES } from '../../constants/tmdb';
import { CustomAlert } from '../ui/CustomAlert';
import { movieService } from '../../services/movieService';
import { tmdbMovieService } from '../../services/tmdbMovieService';
import { tmdbSeriesService } from '../../services/tmdbSeriesService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 480;
const CONTENT_W = Math.min(SCREEN_WIDTH, MAX_WIDTH);
const COLS = 3;
const CARD_GAP = 10;
const SIDE_PAD = 16;
const CARD_W = (CONTENT_W - SIDE_PAD * 2 - CARD_GAP * (COLS - 1)) / COLS;
const CARD_H = CARD_W * 1.5;

interface MediaMeta {
  tmdb_id: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
}

interface Props {
  listId: number | null;
  listType: string;
  onItemPress: (tmdbId: number, mediaType: 'movie' | 'tv') => void;
  onRemoved?: (tmdbId: number, listType: string) => void;
}

export const ProfileListGrid: React.FC<Props> = ({ listId, listType, onItemPress, onRemoved }) => {
  const [items, setItems] = useState<MediaMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteAlert, setDeleteAlert] = useState<{ visible: boolean; item: MediaMeta | null }>({
    visible: false, item: null,
  });
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (listId === null) { setItems([]); setLoading(false); return; }
    load();
  }, [listId]);

  const load = async () => {
    if (!listId) return;
    setLoading(true);
    try {
      const data = await movieService.getListItems(listId);
      const sliced = data.slice(0, 30);

      // Завантажую метадані паралельно визначаючи кожного тип
      const metas = await Promise.allSettled(
        sliced.map(async i => {
          if (i.media_type === 'tv') {
            const d = await tmdbSeriesService.getSeriesDetails(i.tmdb_id);
            return {
              tmdb_id: d.id,
              title: d.name,
              poster_path: d.poster_path,
              release_date: d.first_air_date,
              vote_average: d.vote_average,
              media_type: 'tv' as const,
            };
          } else {
            const d = await tmdbMovieService.getMovieDetails(i.tmdb_id);
            return {
              tmdb_id: d.id,
              title: d.title,
              poster_path: d.poster_path,
              release_date: d.release_date,
              vote_average: d.vote_average,
              media_type: 'movie' as const,
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
          media_type: (sliced[idx].media_type as 'movie' | 'tv') ?? 'movie',
        };
      });

      setItems(loaded);
    } catch (e) {
      console.error('ProfileListGrid load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAlert.item || !listId) return;
    const { tmdb_id } = deleteAlert.item;
    setDeleteAlert({ visible: false, item: null });
    setDeleting(tmdb_id);
    try {
      const { list_type } = await movieService.removeFromList(listId, tmdb_id);
      setItems(prev => prev.filter(m => m.tmdb_id !== tmdb_id));
      onRemoved?.(tmdb_id, list_type);
    } catch (e) {
      console.error('delete from list error:', e);
    } finally {
      setDeleting(null);
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
          {listType === 'watched' ? 'No titles watched yet' :
           listType === 'favorites' ? 'No favorites yet' :
           listType === 'watchlist' ? 'Your watchlist is empty' :
           'This list is empty'}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.grid}>
        {items.map((m, index) => {
          const posterUrl  = m.poster_path ? `${POSTER_SIZES.medium}${m.poster_path}` : null;
          const isDeleting = deleting === m.tmdb_id;
          const marginLeft = index % COLS !== 0 ? CARD_GAP : 0;

          return (
            <TouchableOpacity
              key={`${m.media_type}-${m.tmdb_id}`}
              style={[styles.card, { marginLeft }]}
              activeOpacity={0.8}
              onPress={() => !isDeleting && onItemPress(m.tmdb_id, m.media_type)}
              onLongPress={() => setDeleteAlert({ visible: true, item: m })}
              delayLongPress={400}
            >
              <View style={styles.posterWrap}>
                {isDeleting ? (
                  <View style={styles.posterPlaceholder}>
                    <ActivityIndicator size="small" color={COLORS.gold} />
                  </View>
                ) : posterUrl ? (
                  <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" />
                ) : (
                  <View style={styles.posterPlaceholder}>
                    <Text style={styles.placeholderIcon}>
                      {m.media_type === 'tv' ? '📺' : '🎬'}
                    </Text>
                  </View>
                )}

                {m.vote_average > 0 && !isDeleting && (
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

      <CustomAlert
        visible={deleteAlert.visible}
        title="Remove from list?"
        message={`Remove "${deleteAlert.item?.title}" from this list?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteAlert({ visible: false, item: null })}
        confirmText="Remove"
        cancelText="Cancel"
        confirmStyle="danger"
      />
    </>
  );
};

const styles = StyleSheet.create({
  loader: { paddingVertical: 32, alignItems: 'center' },
  empty: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontFamily: FONTS.regular, fontSize: 13, color: '#2a2a2a' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIDE_PAD,
    paddingTop: 12,
    rowGap: CARD_GAP,
  },
  card: { width: CARD_W },
  posterWrap: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
    marginBottom: 6,
  },
  poster: { width: '100%', height: '100%' },
  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardDark,
  },
  placeholderIcon: { fontSize: 28 },

  ratingBadge: {
    position: 'absolute', bottom: 6, left: 5,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderRadius: 6, paddingVertical: 2, paddingHorizontal: 5,
  },
  ratingText: { fontFamily: FONTS.medium, fontSize: 9, color: COLORS.gold },

  typeBadge: {
    position: 'absolute', top: 6, right: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 5, paddingVertical: 2, paddingHorizontal: 5,
  },
  typeBadgeTv: { backgroundColor: 'rgba(255,175,204,0.25)' },
  typeText: { fontFamily: FONTS.medium, fontSize: 8, color: '#888888' },

  title: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.white, lineHeight: 15 },
  year: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.cardTextLight, marginTop: 2 },
});