 import React from 'react';
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { POSTER_SIZES } from '../../constants/tmdb';
import { MediaItem } from '../../types/tmdb.types';

const COLS = 3;
const CARD_GAP = 10;

interface MovieGridCardProps {
  item: MediaItem;
  index: number;
  cardWidth: number;
  cardHeight: number;
  onPress?: () => void;
}

const getTitle = (item: MediaItem): string =>
  'title' in item ? (item as any).title : (item as any).name;

const getYear = (item: MediaItem): string => {
  const d = 'release_date' in item
    ? (item as any).release_date
    : (item as any).first_air_date;
  return d?.slice(0, 4) ?? '—';
};

export const MovieGridCard: React.FC<MovieGridCardProps> = ({
  item, index, cardWidth, cardHeight, onPress,
}) => {
  const posterUrl = item.poster_path
    ? `${POSTER_SIZES.medium}${item.poster_path}`
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth, marginLeft: index % COLS !== 0 ? CARD_GAP : 0 }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.posterWrap, { width: cardWidth, height: cardHeight }]}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Text style={styles.placeholderIcon}>🎬</Text>
          </View>
        )}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {item.vote_average.toFixed(1)}</Text>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {item.mediaType === 'movie' ? 'Movie' : 'Series'}
          </Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>{getTitle(item)}</Text>
      <Text style={styles.year}>{getYear(item)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card:    {},
  posterWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
    marginBottom: 6,
  },
  poster:            { width: '100%', height: '100%' },
  posterPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.cardDark },
  placeholderIcon:   { fontSize: 28 },
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
  typeText:  { fontFamily: FONTS.medium, fontSize: 8, color: '#888888' },
  title:     { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.white, lineHeight: 15 },
  year:      { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.cardTextLight, marginTop: 2 },
});