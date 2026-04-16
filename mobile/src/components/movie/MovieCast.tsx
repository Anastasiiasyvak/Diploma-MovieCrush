import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { TMDB_IMAGE_BASE } from '../../constants/tmdb';
import { MovieCastMember } from '../../types/movie.types';

const AVATAR_SIZE = 72;

interface Props {
  cast: MovieCastMember[];
  onPersonPress: (personId: number, personName: string) => void;
}

export const MovieCast: React.FC<Props> = ({ cast, onPersonPress }) => {
  if (cast.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Cast</Text>
      <FlatList
        data={cast.slice(0, 20)}
        keyExtractor={item => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const photoUrl = item.profile_path
            ? `${TMDB_IMAGE_BASE}/w185${item.profile_path}`
            : null;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onPersonPress(item.id, item.name)}
              activeOpacity={0.8}
            >
              <View style={styles.avatar}>
                {photoUrl ? (
                  <Image source={{ uri: photoUrl }} style={styles.avatarImg} resizeMode="cover" />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={{ fontSize: 24 }}>🎭</Text>
                  </View>
                )}
              </View>
              <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.character} numberOfLines={1}>{item.character}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

import { SimilarMovie } from '../../types/movie.types';

const CARD_W = 90;
const CARD_H = CARD_W * 1.5;

interface SimilarProps {
  movies: SimilarMovie[];
  onMoviePress: (movieId: number) => void;
}

export const SimilarMovies: React.FC<SimilarProps> = ({ movies, onMoviePress }) => {
  if (movies.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>More Like This</Text>
      <FlatList
        data={movies.slice(0, 15)}
        keyExtractor={item => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const posterUrl = item.poster_path
            ? `${TMDB_IMAGE_BASE}/w185${item.poster_path}`
            : null;
          return (
            <TouchableOpacity
              style={styles.simCard}
              onPress={() => onMoviePress(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.simPoster}>
                {posterUrl ? (
                  <Image source={{ uri: posterUrl }} style={styles.simImg} resizeMode="cover" />
                ) : (
                  <View style={styles.simPlaceholder}><Text style={{ fontSize: 20 }}>🎬</Text></View>
                )}
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>⭐ {item.vote_average.toFixed(1)}</Text>
                </View>
              </View>
              <Text style={styles.simTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.simYear}>{item.release_date?.slice(0, 4) ?? '—'}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

interface PlatformProps {
  tmdbRating: number;
  tmdbVotes: number;
}

export const PlatformRatings: React.FC<PlatformProps> = ({ tmdbRating, tmdbVotes }) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>Ratings</Text>
    <View style={styles.ratingsRow}>
      <View style={styles.ratingChip}>
        <Text style={styles.ratingChipLabel}>TMDB</Text>
        <Text style={styles.ratingChipValue}>{tmdbRating.toFixed(1)}</Text>
        <Text style={styles.ratingChipSub}>{(tmdbVotes / 1000).toFixed(0)}K votes</Text>
      </View>
    </View>
  </View>
);


const styles = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.white, paddingHorizontal: 16 },
  list: { paddingHorizontal: 16, gap: 12 },

  card: { width: AVATAR_SIZE + 8, alignItems: 'center', gap: 4 },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: COLORS.cardDark,
    borderWidth: 1.5,
    borderColor: COLORS.pink,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 14,
  },
  character: {
    fontFamily: FONTS.regular,
    fontSize: 9,
    color: COLORS.cardTextLight,
    textAlign: 'center',
  },

  simCard: { width: CARD_W, gap: 4 },
  simPoster: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.cardDark,
  },
  simImg: { width: '100%', height: '100%' },
  simPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ratingBadge: {
    position: 'absolute',
    bottom: 5,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  ratingText: { fontFamily: FONTS.medium, fontSize: 8, color: COLORS.gold },
  simTitle: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.white, lineHeight: 14 },
  simYear: { fontFamily: FONTS.regular, fontSize: 9, color: COLORS.cardTextLight },

  ratingsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  ratingChip: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: COLORS.cardDark,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 2,
  },
  ratingChipLabel: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.gray },
  ratingChipValue: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.gold },
  ratingChipSub: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.cardTextLight },
});