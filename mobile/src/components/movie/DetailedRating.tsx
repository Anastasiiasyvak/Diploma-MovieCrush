import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { DetailedRating as DetailedRatingType } from '../../types/movie.types';

type ScoreKey = 'director_score' | 'effects_score' | 'script_score' | 'music_score' | 'acting_score';

const CATEGORIES: { key: ScoreKey; label: string; emoji: string }[] = [
  { key: 'director_score', label: 'Direction', emoji: '🎬' },
  { key: 'script_score', label: 'Script', emoji: '✍️' },
  { key: 'effects_score', label: 'Visuals', emoji: '✨' },
  { key: 'music_score', label: 'Soundtrack', emoji: '🎵' },
  { key: 'acting_score', label: 'Acting', emoji: '🎭' },
];

interface Props {
  rating: DetailedRatingType;
  onChange: (key: ScoreKey, val: number) => void;
  loading?: boolean;
}

const ScoreRow: React.FC<{
  emoji: string;
  label: string;
  value: number | null;
  onPress: (val: number) => void;
}> = ({ emoji, label, value, onPress }) => (
  <View style={styles.scoreRow}>
    <Text style={styles.scoreEmoji}>{emoji}</Text>
    <Text style={styles.scoreLabel}>{label}</Text>
    <View style={styles.dots}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity
          key={i}
          onPress={() => onPress(i)}
          activeOpacity={0.7}
          style={styles.dotBtn}
        >
          <View style={[
            styles.dot,
            value !== null && i <= value && styles.dotFilled,
          ]} />
        </TouchableOpacity>
      ))}
    </View>
    <Text style={styles.scoreValue}>
      {value !== null ? `${value}/5` : '—'}
    </Text>
  </View>
);

export const DetailedRatingSection: React.FC<Props> = ({ rating, onChange, loading = false }) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>Detailed Rating</Text>
    <Text style={styles.subtitle}>Rate individual aspects (1–5)</Text>

    {loading ? (
      <ActivityIndicator color={COLORS.gold} style={{ marginTop: 8 }} />
    ) : (
      <View style={styles.categories}>
        {CATEGORIES.map(({ key, label, emoji }) => (
          <ScoreRow
            key={key}
            emoji={emoji}
            label={label}
            value={rating[key]}
            onPress={val => onChange(key, val)}
          />
        ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, gap: 12 },
  title: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.white },
  subtitle: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray, marginTop: -6 },

  categories: { gap: 14 },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scoreEmoji: { fontSize: 16, width: 24, textAlign: 'center' },
  scoreLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.white,
    width: 90,
  },
  dots: { flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' },
  dotBtn: { padding: 2 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.cardDark,
    borderWidth: 1.5,
    borderColor: '#333',
  },
  dotFilled: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  scoreValue: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.gold,
    width: 32,
    textAlign: 'right',
  },
});