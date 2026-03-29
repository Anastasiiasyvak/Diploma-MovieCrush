import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';


const RATING_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface RatingChipsProps {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}

export const RatingChips: React.FC<RatingChipsProps> = ({ min, max, onChange }) => {
  const isAny = min === 1 && max === 10;

  const handlePress = (val: number) => {
    if (isAny) {
      onChange(val, val);
    } else if (val < min) {
      onChange(val, max);
    } else if (val > max) {
      onChange(min, val);
    } else if (val === min && val === max) {
      onChange(1, 10);
    } else if (val === min) {
      onChange(min + 1, max);
    } else if (val === max) {
      onChange(min, max - 1);
    } else {
      onChange(val, val);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.chipRow}>
        {RATING_VALUES.map(val => {
          const isInRange = val >= min && val <= max && !isAny;
          const isEdge    = (val === min || val === max) && !isAny;
          return (
            <TouchableOpacity
              key={val}
              style={[styles.chip, isInRange && styles.chipInRange, isEdge && styles.chipEdge]}
              onPress={() => handlePress(val)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.chipText,
                isInRange && styles.chipTextActive,
                isEdge && styles.chipTextEdge,
              ]}>
                {val}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.hint}>
        {isAny ? 'Any rating' : min === max ? `Rating: ${min}` : `Rating: ${min} – ${max}`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap:    { paddingHorizontal: 16, marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
  chip: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 13,
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
  },
  chipInRange: {
    backgroundColor: 'rgba(255,175,204,0.1)',
    borderColor: COLORS.pink,
  },
  chipEdge: {
    backgroundColor: 'rgba(255,175,204,0.25)',
    borderColor: COLORS.pink,
  },
  chipText:       { fontFamily: FONTS.regular,  fontSize: 12, color: '#888888' },
  chipTextActive: { color: COLORS.pink, fontFamily: FONTS.medium },
  chipTextEdge:   { color: COLORS.pink, fontFamily: FONTS.bold },
  hint: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.pink,
    marginTop: 10,
    textAlign: 'center',
  },
});