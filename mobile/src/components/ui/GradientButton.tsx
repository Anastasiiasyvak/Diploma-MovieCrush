import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || isLoading}
      style={[styles.wrapper, style]}
    >
      <LinearGradient
        colors={[COLORS.goldHover, COLORS.gold]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.background} />
        ) : (
          <Text style={[styles.label, textStyle]}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 50,
    overflow: 'hidden',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    borderRadius: 50,
  },
  label: {
    fontFamily: FONTS.semiBold,
    color: COLORS.background,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});