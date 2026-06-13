import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface SettingsSectionProps {
  label: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ label, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <View style={styles.card}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.darkGray,
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#0d0d0d',
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: COLORS.cardDark,
    overflow: 'hidden',
  },
});