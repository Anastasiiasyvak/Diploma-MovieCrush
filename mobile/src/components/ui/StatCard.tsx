import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface StatCardProps {
  value: number;
  label: string;
  onPress?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, onPress }) => {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.value}>{value.toLocaleString()}</Text>
      <Text style={styles.label}>{label}</Text>
    </Wrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#111111',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#1f1f1f',
  },
  value: {
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    color: COLORS.gold,
  },
  label: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: '#555555',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});