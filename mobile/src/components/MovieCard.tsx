import React from 'react';
import { TouchableOpacity, Image, Text, View, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { POSTER_SIZES } from '../constants/tmdb';

interface MovieCardProps {
  posterPath: string | null;
  title: string;
  year: string;
  rating: number;
  onPress?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  posterPath,
  title,
  year,
  rating,
  onPress,
}) => {
  const posterUrl = posterPath ? `${POSTER_SIZES.small}${posterPath}` : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.posterWrapper}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Text style={styles.posterPlaceholderIcon}>🎬</Text>
          </View>
        )}
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {rating.toFixed(1)}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
      <Text style={styles.cardYear}>{year || '—'}</Text>
    </TouchableOpacity>
  );
};

const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;

const styles = StyleSheet.create({
  card: { width: CARD_WIDTH },
  posterWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
    marginBottom: 8,
  },
  poster: { width: '100%', height: '100%' },
  posterPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardDark,
  },
  posterPlaceholderIcon: { fontSize: 32 },
  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  ratingText: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.gold },
  cardTitle: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.white, lineHeight: 16 },
  cardYear: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.cardTextLight, marginTop: 2 },
});