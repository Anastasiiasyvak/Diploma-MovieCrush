import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Logo } from '../../components/ui/Logo';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { soulmateService, SoulmateMatch } from '../../services/soulmateService';
import { styles } from './SoulmateScreen.styles';


const RECOMPUTE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const isRecomputeCoolingDown = (computedAt: string): boolean => {
  const elapsed = Date.now() - new Date(computedAt).getTime();
  return elapsed < RECOMPUTE_COOLDOWN_MS;
};

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

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
}

export default function SoulmateScreen({ navigation }: any) {
  const [match, setMatch] = useState<SoulmateMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [alert, setAlert] = useState<AlertState>({ visible: false, title: '', message: '' });

  const openAlert = (title: string, message: string) =>
    setAlert({ visible: true, title, message });
  const closeAlert = () => setAlert(prev => ({ ...prev, visible: false }));

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
        openAlert(
          'No match yet',
          'No suitable soulmate found. Try again when more users join MovieCrush!'
        );
      }
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 429) {
        if (data?.match) setMatch(data.match);
        openAlert(
          'Already updated today',
          data?.error ?? "You've already updated your soulmate today. Come back tomorrow!"
        );
      } else if (status === 403) {
        openAlert(
          'Enable soulmate matching',
          data?.error ?? 'You need to enable soulmate matching in Settings first.'
        );
      } else {
        const msg = data?.error ?? 'Could not compute soulmate';
        openAlert('Oops', msg);
      }
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

  const recomputeOnCooldown = match ? isRecomputeCoolingDown(match.computed_at) : false;

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
              <BreakdownBar label="Disliked" value={match.breakdown.disliked} />

              <Text style={styles.sectionTitle}>Shared</Text>
              <Text style={styles.sharedText}>
                🎬  {match.shared_movies_count} movies you both rated{'\n'}
                💔  {match.shared_disliked.length} movies you both disliked
              </Text>

              <View style={styles.actionsWrap}>
                {recomputeOnCooldown ? (
                  <Text style={styles.cooldownNote}>
                    You've already updated today, in the future this function will be available only once a year. But for testing purposes you can click it again tomorrow
                  </Text>
                ) : (
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
                )}
              </View>
            </>
          )}

        </View>
      </ScrollView>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        confirmText="OK"
        hideCancel
        onConfirm={closeAlert}
      />
    </View>
  );
}