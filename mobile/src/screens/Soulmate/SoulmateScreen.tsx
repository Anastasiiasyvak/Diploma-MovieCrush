import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Logo } from '../../components/ui/Logo';
import { soulmateService, SoulmateMatch } from '../../services/soulmateService';
import { styles } from './SoulmateScreen.styles';

const Avatar: React.FC<{ imageUrl?: string | null }> = ({ imageUrl }) => (
  <View style={styles.avatarWrap}>
    {imageUrl ? (
      <Image source={{ uri: imageUrl }} style={styles.avatarImg} />
    ) : (
      <View style={styles.avatarPlaceholder}>
        <View style={styles.silhouetteHead} />
        <View style={styles.silhouetteBody} />
      </View>
    )}
  </View>
);

const BreakdownBar: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.breakdownRow}>
    <Text style={styles.breakdownLabel}>{label}</Text>
    <View style={styles.breakdownBarBg}>
      <View style={[styles.breakdownBarFg, { width: `${Math.round(value * 100)}%` }]} />
    </View>
    <Text style={styles.breakdownPct}>{Math.round(value * 100)}%</Text>
  </View>
);

export default function SoulmateScreen({ navigation }: any) {
  const [match, setMatch] = useState<SoulmateMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);

  const loadMatch = useCallback(async () => {
    setIsLoading(true);
    try {
      const m = await soulmateService.getMyMatch();
      setMatch(m);
    } catch (err) {
      console.error('SoulmateScreen load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadMatch(); }, [loadMatch]);

  const handleRecompute = async () => {
    setIsComputing(true);
    try {
      const newMatch = await soulmateService.recompute();
      if (newMatch) {
        setMatch(newMatch);
      } else {
        Alert.alert(
          'No match yet',
          'No suitable soulmate found. Try again when more users join MovieCrush!'
        );
      }
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Could not compute soulmate';
      Alert.alert('Oops', msg);
    } finally {
      setIsComputing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.gold} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.inner}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Logo />
            <View style={styles.headerSpacer} />
          </View>

          {!match && (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>💫</Text>
              <Text style={styles.emptyTitle}>Find your cinema soulmate</Text>
              <Text style={styles.emptyText}>
                Press the button below and we'll find a person whose movie taste matches yours best.
              </Text>

              <View style={[styles.actionsWrap, { width: '100%', marginTop: 12 }]}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleRecompute}
                  disabled={isComputing}
                  activeOpacity={0.85}
                >
                  {isComputing ? (
                    <ActivityIndicator color={COLORS.background} />
                  ) : (
                    <Text style={styles.primaryBtnText}>Find my soulmate ✨</Text>
                  )}
                </TouchableOpacity>
              </View>

              <Text style={styles.consentNote}>
                Make sure "Find my soulmate" is enabled in Settings.
                We only show users who also opted in.
              </Text>
            </View>
          )}

          {match && (
            <>
              <View style={styles.heroWrap}>
                <Text style={styles.congratsLabel}>Your cinema soulmate</Text>
                <Text style={styles.congratsTitle}>
                  We've found a movie buddy for you 💕
                </Text>

                <Avatar imageUrl={match.matched_user.profile_image_url} />

                <Text style={styles.matchUsername}>@{match.matched_user.username}</Text>
                {(match.matched_user.first_name || match.matched_user.last_name) && (
                  <Text style={styles.matchFullName}>
                    {[match.matched_user.first_name, match.matched_user.last_name]
                      .filter(Boolean).join(' ')}
                  </Text>
                )}

                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreNum}>{match.similarity_percent}%</Text>
                  <Text style={styles.scoreLabel}>Compatibility</Text>
                </View>

                <TouchableOpacity
                  style={styles.viewProfileBtn}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('UserProfile', {
                    userId: match.matched_user.id,
                  })}
                >
                  <Text style={styles.viewProfileText}>View profile</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionTitle}>Why you match</Text>
              <BreakdownBar label="Ratings" value={match.breakdown.rating} />
              <BreakdownBar label="Watched" value={match.breakdown.genre} />
              <BreakdownBar label="Actors" value={match.breakdown.actor} />
              <BreakdownBar label="Mood" value={match.breakdown.mood} />
              <BreakdownBar label="Directors" value={match.breakdown.director} />
              <BreakdownBar label="Disliked" value={match.breakdown.disliked} />

              <Text style={styles.sectionTitle}>Shared</Text>
              <Text style={styles.sharedText}>
                🎬  {match.shared_movies_count} movies you both rated{'\n'}
                💔  {match.shared_disliked.length} movies you both disliked
              </Text>

              <View style={styles.actionsWrap}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleRecompute}
                  disabled={isComputing}
                  activeOpacity={0.85}
                >
                  {isComputing ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <Text style={styles.secondaryBtnText}>Recompute</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>
      </ScrollView>
    </View>
  );
}