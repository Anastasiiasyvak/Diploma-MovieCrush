import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { Logo } from '../../components/ui/Logo';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Logo style={styles.logo} />
      <Text style={styles.text}>🎬 Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  logo: {
    fontSize: 28,
  },
  text: {
    fontFamily: FONTS.regular,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
});