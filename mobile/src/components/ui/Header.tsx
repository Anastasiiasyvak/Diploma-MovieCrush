import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Logo } from './Logo';
import { COLORS } from '../../constants/colors';

interface HeaderProps {
  onProfilePress: () => void;
  showProfile?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onProfilePress, showProfile = true }) => {
  return (
    <View style={styles.header}>
      <Logo />
      {showProfile && (
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={onProfilePress}
          activeOpacity={0.7}
        >
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarIcon}>👤</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.cardDark,
  },
  profileBtn: { padding: 4 },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.cardDark,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: { fontSize: 16 },
});