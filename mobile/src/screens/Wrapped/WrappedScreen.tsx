import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Logo } from '../../components/ui/Logo';
import { wrappedService } from '../../services/wrappedService';
import { styles } from './WrappedScreen.styles';
import { WrappedSummary } from '../../types/wrapped.types';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', inspired: '✨', scared: '😱', sad: '😢',
  thoughtful: '🤔', bored: '😐', excited: '🔥', romantic: '💕',
  angry: '😠', relaxed: '😌',
};

const MOOD_DESCRIPTION: Record<string, string> = {
  happy: 'You like joyful, uplifting stories',
  inspired: 'You seek inspiration in cinema',
  scared: 'You love a good thrill',
  sad: 'Drama and tear-jerkers are your thing',
  thoughtful: 'You enjoy films that make you think',
  bored: 'Sometimes nothing hits — and that\'s okay',
  excited: 'You love high-energy, gripping stories',
  romantic: 'Love stories tug at your heartstrings',
  angry: 'You connect with raw, intense films',
  relaxed: 'You enjoy easy, calming watches',
};

const Slide: React.FC<{
  colors: string[];
  title: string;
  children: React.ReactNode;
}> = ({ colors, title, children }) => (
  <LinearGradient
    colors={colors as any}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.slide}
  >
    <Text style={styles.slideTitle}>{title}</Text>
    {children}
  </LinearGradient>
);

export default function WrappedScreen({ navigation }: any) {
  const [data, setData] = useState<WrappedSummary | null>(null);  
  const [isLoading, setIsLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);

  const canRecompute = !data || (() => {
    const computed = new Date(data.computed_at);
    const now = new Date();
    const diffHours = (now.getTime() - computed.getTime()) / (1000 * 60 * 60);
    return diffHours >= 24;
  })();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const w = await wrappedService.getMyWrapped();
      setData(w);
    } catch (err) {
      console.error('WrappedScreen load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRecompute = async () => {
    setIsComputing(true);
    try {
      const w = await wrappedService.recompute();
      if (w) setData(w);
      else Alert.alert('Empty', 'No data yet to compute Wrapped.');
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Could not compute Wrapped';
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

  if (!data) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Logo />
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>🎬</Text>
          <Text style={styles.emptyTitle}>Your Wrapped isn't ready yet</Text>
          <Text style={styles.emptyText}>
            Press the button below to compute your year-in-cinema recap.
          </Text>

          <TouchableOpacity
            style={[styles.primaryBtn, { width: '100%', marginTop: 12 }]}
            onPress={handleRecompute}
            disabled={isComputing}
            activeOpacity={0.85}
          >
            {isComputing
              ? <ActivityIndicator color={COLORS.background} />
              : <Text style={styles.primaryBtnText}>Compute my Wrapped ✨</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const habits = data.watch_habits;
  const habitsLine = (() => {
    const parts: string[] = [];
    if (habits.weekday !== null) parts.push(WEEKDAYS[habits.weekday]);
    if (habits.hour !== null) parts.push(`${habits.hour}:00`);
    return parts;
  })();

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

          {/* Intro */}
          <Text style={styles.yearTitle}>{data.wrapped_year} Wrapped</Text>
          <Text style={styles.yearSubtitle}>Your year in cinema 🎬</Text>

          {/* Total time */}
          <Slide colors={['#FFAFCC', '#FFD700']} title="Time spent watching">
            <Text style={styles.bigNumber}>
              {data.total_hours}<Text style={styles.bigNumberSuffix}> hours</Text>
            </Text>
            <Text style={styles.bigSubtext}>
              That's {data.total_days} days of pure cinema time —
              {data.total_minutes.toLocaleString()} minutes total.
            </Text>
          </Slide>

          {/* Cinema vibe */}
          {data.cinema_vibe && (
            <Slide colors={['#5E60CE', '#7400B8']} title="Your cinema vibe">
              <Text style={styles.topName}>{data.cinema_vibe}</Text>
              <Text style={styles.bigSubtext}>{data.cinema_vibe_stat}</Text>
            </Slide>
          )}

          {/* Counts */}
          <Slide colors={['#06D6A0', '#118AB2']} title="What you watched">
            <View style={styles.countsRow}>
              <View style={styles.countCard}>
                <Text style={styles.countNum}>{data.movies_count}</Text>
                <Text style={styles.countLabel}>Movies</Text>
              </View>
              <View style={styles.countCard}>
                <Text style={styles.countNum}>{data.series_count}</Text>
                <Text style={styles.countLabel}>Series</Text>
              </View>
              <View style={styles.countCard}>
                <Text style={styles.countNum}>{data.episodes_count}</Text>
                <Text style={styles.countLabel}>Episodes</Text>
              </View>
            </View>
          </Slide>

          {/* Top genre */}
          {data.top_genre && (
            <Slide colors={['#F72585', '#7209B7']} title="Your top genre">
              <Text style={styles.topName}>{data.top_genre.name}</Text>
              <Text style={styles.topSubtitle}>
                The genre that defined your year in cinema.
              </Text>
            </Slide>
          )}

          {/* Top director */}
          {data.top_director && (
            <Slide colors={['#3A0CA3', '#4361EE']} title="Your top director">
              <Text style={styles.topName}>{data.top_director.name}</Text>
              <Text style={styles.topSubtitle}>
                You watched their work more than anyone else's this year.
              </Text>
            </Slide>
          )}

          {/* Top 5 actors */}
          {data.top_actors.length > 0 && (
            <Slide colors={['#FF006E', '#FB5607']} title="Your top actors">
              <Text style={styles.topSubtitle}>
                Based on who you voted as the best in their roles
              </Text>
              <View style={styles.actorsList}>
                {data.top_actors.map((a, idx) => (
                  <View key={a.tmdb_id} style={styles.actorRow}>
                    <Text style={styles.actorRank}>{idx + 1}</Text>
                    <Text style={styles.actorName}>{a.name}</Text>
                    <Text style={styles.actorVotes}>{a.votes} {a.votes === 1 ? 'vote' : 'votes'}</Text>
                  </View>
                ))}
              </View>
            </Slide>
          )}

          {/* Mood */}
          {data.top_mood && (
            <Slide colors={['#06D6A0', '#5E60CE']} title="Your dominant mood">
              <Text style={styles.bigNumber}>
                {MOOD_EMOJI[data.top_mood.mood] ?? '🎭'} {data.top_mood.mood}
              </Text>
              <Text style={styles.bigSubtext}>
                {MOOD_DESCRIPTION[data.top_mood.mood] ?? 'Your unique vibe'} —
                {' '}{data.top_mood.count} {data.top_mood.count === 1 ? 'film' : 'films'} matched this mood.
              </Text>
            </Slide>
          )}

          {/* Watch habits */}
          {habitsLine.length > 0 && (
            <Slide colors={['#B5179E', '#560BAD']} title="Your cinema ritual">
              <Text style={styles.topName}>
                {habitsLine.join(' · ')}
              </Text>
              <Text style={styles.topSubtitle}>
                When you most often watch movies 🍿
              </Text>
            </Slide>
          )}

          {/* Top fan */}
          {data.top_fan && (
            <Slide colors={['#FF006E', '#FFBE0B']} title="Top fan badge">
              <Text style={styles.topName}>{data.top_fan.actor_name}</Text>
              {data.top_fan.minutes > 0 && (
                <Text style={styles.topFanLine}>
                  You spent <Text style={styles.topFanHighlight}>{data.top_fan.minutes} minutes</Text>
                  {' '}with their films this year.
                </Text>
              )}
              {data.top_fan.percentile !== null && (
                <Text style={styles.topFanLine}>
                  You're in the
                  <Text style={styles.topFanHighlight}> top {data.top_fan.percentile}% </Text>
                  of their fans on MovieCrush 🏆
                </Text>
              )}
            </Slide>
          )}

          {/* Recompute */}
          <View style={styles.footerWrap}>
            <TouchableOpacity
              style={styles.recomputeBtn}
              onPress={handleRecompute}
              disabled={isComputing || !canRecompute}
              activeOpacity={0.85}
            >
              {isComputing
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.recomputeText}>Recompute</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.recomputeHint}>
            {canRecompute
              ? 'MovieCrush Wrapped will be generated once a year. But now for testing, you can recompute once per day.'
              : 'MovieCrush Wrapped will be generated once a year, but for testing, you can recompute once per day. But you\'ve already recomputed today. Come back tomorrow! 🎬'}
          </Text>
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}