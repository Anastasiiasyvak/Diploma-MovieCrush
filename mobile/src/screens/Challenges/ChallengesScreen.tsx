import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Logo } from '../../components/ui/Logo';
import { SoulmateCard } from '../../components/soulmate/SoulmateCard';
import { styles } from './ChallengesScreen.styles';

const SOULMATE_DEV_PREVIEW = process.env['EXPO_PUBLIC_SOULMATE_DEV_PREVIEW'] === 'true';

export default function ChallengesScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.centered}>
        <View style={styles.header}>
          <Logo />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {SOULMATE_DEV_PREVIEW && (
            <SoulmateCard onPress={() => navigation.navigate('Soulmate')} />
          )}

          <View style={styles.placeholder}>
            <Text style={styles.emoji}>🏆</Text>
            <Text style={styles.title}>More challenges coming soon</Text>
            <Text style={styles.subtitle}>
              Yearly stats, achievements, and more.
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}