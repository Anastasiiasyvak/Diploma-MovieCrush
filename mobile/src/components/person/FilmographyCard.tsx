import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { POSTER_SIZES } from '../../constants/tmdb';
import { CastCredit, CrewCredit } from '../../types/person.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 480;
const CONTENT_W = Math.min(SCREEN_WIDTH, MAX_WIDTH);
const CARD_W = CONTENT_W * 0.36;
const CARD_H = CARD_W * 1.5;

interface FilmographyCardProps {
  item: CastCredit | CrewCredit;
  onPress?: () => void; // я поки не реалізувала
}

const getTitle = (item: CastCredit | CrewCredit): string =>
  item.title ?? item.name ?? 'Unknown';

const getYear = (item: CastCredit | CrewCredit): string => {
  const date = item.release_date ?? item.first_air_date;
  return date ? date.slice(0, 4) : '—';
};

const getRoleLabel = (item: CastCredit | CrewCredit): string => {
  if ('character' in item && item.character) return item.character;
  if ('job' in item && item.job) return item.job;
  return '—';
};

export const FilmographyCard: React.FC<FilmographyCardProps> = ({ item, onPress }) => {
  const posterUrl = item.poster_path
    ? `${POSTER_SIZES.medium}${item.poster_path}`
    : null;

  const title = getTitle(item);
  const year = getYear(item);
  const role = getRoleLabel(item);
  const isCast = 'character' in item;
  const mediaTag = item.media_type === 'movie' ? 'Movie' : 'Series';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
    >
      <View style={styles.poster}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.posterImg} resizeMode="cover" />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Text style={styles.placeholderEmoji}>🎬</Text>
          </View>
        )}

        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{mediaTag}</Text>
        </View>

        {item.vote_average > 0 && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {item.vote_average.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <Text style={styles.year}>{year}</Text>

      <View style={[styles.roleChip, isCast ? styles.roleChipCast : styles.roleChipCrew]}>
        <Text style={[styles.roleChipText, isCast ? styles.roleChipTextCast : styles.roleChipTextCrew]} numberOfLines={1}>
          {role}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    marginRight: 12,
  },

  poster: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
    marginBottom: 7,
  },
  posterImg: { width: '100%', height: '100%' },
  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardDark,
  },
  placeholderEmoji: { fontSize: 28 },

  typeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  typeBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 8,
    color: COLORS.gray,
  },

  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  ratingText: {
    fontFamily: FONTS.medium,
    fontSize: 9,
    color: COLORS.gold,
  },

  title: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.white,
    lineHeight: 15,
    marginBottom: 2,
  },
  year: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.cardTextLight,
    marginBottom: 5,
  },

  roleChip: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 7,
    maxWidth: CARD_W,
  },
  roleChipCast: {
    backgroundColor: 'rgba(255,175,204,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,175,204,0.4)',
  },
  roleChipCrew: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  roleChipText: {
    fontFamily: FONTS.regular,
    fontSize: 9,
  },
  roleChipTextCast: { color: COLORS.pink },
  roleChipTextCrew: { color: COLORS.gold },
});