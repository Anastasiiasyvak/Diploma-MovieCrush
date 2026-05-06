import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './WrappedCard.styles';

interface Props {
  onPress: () => void;
}

export const WrappedCard: React.FC<Props> = ({ onPress }) => (
  <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={styles.wrap}>
    <LinearGradient
      colors={['#06D6A0', '#118AB2']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>🎬</Text>
        <View style={styles.textBlock}>
          <Text style={styles.title}>Your MovieCrush Wrapped</Text>
          <Text style={styles.subtitle}>
            See your year-in-cinema recap - top movies, actors, genres
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