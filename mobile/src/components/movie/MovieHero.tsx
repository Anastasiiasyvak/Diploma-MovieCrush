import React from 'react';
import {
  View, Text, Image, StyleSheet, Dimensions, TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { TMDB_IMAGE_BASE } from '../../constants/tmdb';
import { MovieDetails } from '../../types/movie.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 480;
const CONTENT_W = Math.min(SCREEN_WIDTH, MAX_WIDTH);
const BACKDROP_H = CONTENT_W * 0.56;
const POSTER_W = 100;
const POSTER_H = POSTER_W * 1.5;

interface Props {
  movie: MovieDetails;
  onBack: () => void;
}

const StarBar: React.FC<{ rating: number }> = ({ rating }) => {
  const stars = Math.round(rating / 2);
  return (
    <View style={styles.starBar}>
      {[1,2,3,4,5].map(i => (
        <Text key={i} style={[styles.starIcon, { opacity: i <= stars ? 1 : 0.25 }]}>★</Text>
      ))}
      <Text style={styles.ratingNum}>{rating.toFixed(1)}</Text>
    </View>
  );

  function movie(): MovieDetails { return null as any; } // щоб не ругалось на типи, я поки не підключила дані сюди
};

export const MovieHero: React.FC<Props> = ({ movie, onBack }) => {
  const backdropUrl = movie.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w780${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path
    ? `${TMDB_IMAGE_BASE}/w342${movie.poster_path}`
    : null;

  const year = movie.release_date?.slice(0, 4) ?? '—';
  const stars = Math.round(movie.vote_average / 2);

  return (
    <View>
      <View style={styles.backdropWrap}>
        {backdropUrl ? (
          <Image source={{ uri: backdropUrl }} style={styles.backdrop} resizeMode="cover" />
        ) : (
          <View style={[styles.backdrop, styles.backdropPlaceholder]} />
        )}
        <View style={styles.backdropGradient} />

        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.posterWrap}>
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" />
          ) : (
            <View style={[styles.poster, styles.posterPlaceholder]}>
              <Text style={{ fontSize: 32 }}>🎬</Text>
            </View>
          )}
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={3}>{movie.title}</Text>
          {movie.tagline ? (
            <Text style={styles.tagline} numberOfLines={2}>"{movie.tagline}"</Text>
          ) : null}
          <Text style={styles.year}>{year}</Text>

          <View style={styles.starRow}>
            {[1,2,3,4,5].map(i => (
              <Text key={i} style={[styles.starIcon, { opacity: i <= stars ? 1 : 0.25 }]}>★</Text>
            ))}
            <Text style={styles.ratingNum}> {movie.vote_average.toFixed(1)}</Text>
          </View>
          <Text style={styles.voteCount}>{movie.vote_count.toLocaleString()} votes</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdropWrap: {
    width: '100%',
    height: BACKDROP_H,
    position: 'relative',
  },
  backdrop: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.cardDark,
  },
  backdropPlaceholder: { backgroundColor: '#111' },
  backdropGradient: {
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
  },

  backBtn: {
    position: 'absolute',
    top: 44,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: { fontFamily: FONTS.medium, fontSize: 18, color: COLORS.white },

  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 14,
    alignItems: 'flex-start',
  },

  posterWrap: {
    width: POSTER_W,
    height: POSTER_H,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.gold,
    flexShrink: 0,
    marginTop: -POSTER_H * 0.35,  
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  poster: { width: '100%', height: '100%' },
  posterPlaceholder: {
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  titleBlock: { flex: 1, paddingTop: 4 },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.white,
    lineHeight: 24,
    marginBottom: 4,
  },
  tagline: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginBottom: 4,
    lineHeight: 16,
  },
  year: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.cardTextLight,
    marginBottom: 8,
  },
  starRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  starIcon: { fontSize: 14, color: COLORS.gold },
  ratingNum: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.gold, marginLeft: 2 },
  voteCount: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.cardTextLight },
  starBar: { flexDirection: 'row', alignItems: 'center' },
});