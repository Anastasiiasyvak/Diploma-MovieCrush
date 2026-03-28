import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';
import { FONTS } from '../../constants/fonts';
import { COLORS } from '../../constants/colors';

interface SocialButtonProps {
  type: 'telegram' | 'instagram';
  username?: string;
}

const SOCIAL_CONFIG = {
  telegram: {
    label: 'Telegram',
    color: COLORS.pink,
    urlPrefix: 'https://t.me/',
  },
  instagram: {
    label: 'Instagram',
    color: COLORS.pink,
    urlPrefix: 'https://instagram.com/',
  },
} as const;

export const SocialButton: React.FC<SocialButtonProps> = ({ type, username }) => {
  if (!username) return null;

  const config = SOCIAL_CONFIG[type];

  return (
    <TouchableOpacity
      style={[styles.button, { borderColor: config.color }]}
      onPress={() => Linking.openURL(`${config.urlPrefix}${username}`)}
      activeOpacity={0.7}
    >
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
});