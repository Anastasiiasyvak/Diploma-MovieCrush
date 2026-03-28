import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { Logo } from '../../components/ui/Logo';

export default function RecommendationsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <View style={styles.header}>
          <Logo />
        </View>
        <View style={styles.body}>
          <Text style={styles.emoji}>🤖</Text>
          <Text style={styles.title}>AI Recommendations</Text>
          <Text style={styles.subtitle}>Coming soon...</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered:  { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.cardDark,
    alignItems: 'center',
  },
  body:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emoji:    { fontSize: 56 },
  title:    { fontFamily: FONTS.semiBold, fontSize: 20, color: COLORS.white },
  subtitle: { fontFamily: FONTS.regular,  fontSize: 14, color: COLORS.darkGray },
});