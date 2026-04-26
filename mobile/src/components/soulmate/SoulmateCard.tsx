import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './SoulmateCard.styles';

interface Props {
  onPress: () => void;
}

export const SoulmateCard: React.FC<Props> = ({ onPress }) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.wrap}>
    <LinearGradient
      colors={['#FFAFCC', '#FFD700']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>💕</Text>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Find your cinema soulmate</Text>
          <Text style={styles.subtitle}>
            We'll match you with the user whose taste is closest to yours
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.devBadge}>
        <Text style={styles.devBadgeText}>DEV PREVIEW</Text>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);