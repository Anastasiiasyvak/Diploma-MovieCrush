import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface LogoProps {
  style?: TextStyle;
}

export const Logo: React.FC<LogoProps> = ({ style }) => {
  return (
    <Text style={[styles.logo, style]}>
      MovieCrush
    </Text>
  );
};

const styles = StyleSheet.create({
  logo: {
    fontSize: 22,
    fontFamily: FONTS.semiBold,
    color: COLORS.pink,
    textAlign: 'center',
    letterSpacing: 1,
  },
});