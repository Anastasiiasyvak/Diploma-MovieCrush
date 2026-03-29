import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  chip: {
    backgroundColor: COLORS.cardDark,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
  },
  chipActive: {
    backgroundColor: 'rgba(255,175,204,0.15)',
    borderColor: COLORS.pink,
  },
  chipText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: '#888888',
  },
  chipTextActive: {
    color: COLORS.pink,
    fontFamily: FONTS.medium,
  },
});