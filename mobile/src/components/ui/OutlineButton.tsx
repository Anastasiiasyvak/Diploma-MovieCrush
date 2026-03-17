import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface OutlineButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const OutlineButton: React.FC<OutlineButtonProps> = ({
  label,
  onPress,
  disabled = false,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, style]}
    >
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    backgroundColor: COLORS.transparent,
  },
  label: {
    fontFamily: FONTS.medium,
    color: COLORS.gold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});