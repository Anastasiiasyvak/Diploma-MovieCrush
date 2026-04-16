import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { MoodType } from '../../types/movie.types';

const MOODS: { key: MoodType; emoji: string; label: string }[] = [
  { key: 'happy', emoji: '😄', label: 'Happy'      },
  { key: 'inspired', emoji: '🤩', label: 'Inspired'   },
  { key: 'scared', emoji: '😱', label: 'Scared'     },
  { key: 'sad', emoji: '😢', label: 'Sad'        },
  { key: 'thoughtful', emoji: '🤔', label: 'Thoughtful' },
  { key: 'excited', emoji: '🤯', label: 'Excited'    },
];

interface Props {
  selected: MoodType | null;
  onSelect: (mood: MoodType) => void;
  loading?: boolean;
}

export const MoodPicker: React.FC<Props> = ({ selected, onSelect, loading = false }) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>How did it make you feel?</Text>

    {loading ? (
      <ActivityIndicator color={COLORS.gold} style={{ marginTop: 8 }} />
    ) : (
      <View style={styles.grid}>
        {MOODS.map(({ key, emoji, label }) => {
          const isActive = selected === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onSelect(key)}
              activeOpacity={0.75}
            >
              <Text style={styles.emoji}>{emoji}</Text>
              <Text style={[styles.label, isActive && styles.labelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, gap: 12 },
  title: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.white },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  chip: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.cardDark,
    minWidth: 80,
  },
  chipActive: {
    backgroundColor: 'rgba(255,175,204,0.15)',
    borderColor: COLORS.pink,
  },

  emoji: { fontSize: 28 },
  label: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.cardTextLight,
  },
  labelActive: {
    fontFamily: FONTS.medium,
    color: COLORS.pink,
  },
});