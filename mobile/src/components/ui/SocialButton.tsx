import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface SocialButtonProps {
  type: 'telegram' | 'instagram';
  username?: string;
  onAddPress?: () => void;
}

const SOCIAL_CONFIG = {
  telegram: {
    label: 'Telegram',
    color: '#2ca5e0',
    urlPrefix: 'https://t.me/',
  },
  instagram: {
    label: 'Instagram',
    color: '#e1306c',
    urlPrefix: 'https://instagram.com/',
  },
} as const;

export const SocialButton: React.FC<SocialButtonProps> = ({ type, username, onAddPress }) => {
  const config = SOCIAL_CONFIG[type];
  const hasUsername = !!username;

  const handlePress = () => {
    if (hasUsername) {
      Linking.openURL(`${config.urlPrefix}${username}`);
    } else {
      onAddPress?.();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        hasUsername
          ? { borderColor: config.color }
          : styles.empty,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.label,
          { color: hasUsername ? config.color : COLORS.gray },
        ]}
      >
        {hasUsername ? config.label : `+ ${config.label}`}
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
    borderColor: 'transparent',
    backgroundColor: COLORS.transparent,
  },
  empty: {
    borderColor: '#333333',
    borderStyle: 'dashed',
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 12,
  },
});