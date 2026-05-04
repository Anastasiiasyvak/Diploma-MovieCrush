import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StatusBar, Image, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Logo } from '../../components/ui/Logo';
import { wrappedService, WrappedSummary } from '../../services/wrappedService';
import { POSTER_SIZES } from '../../constants/tmdb';
import { styles } from './WrappedScreen.styles';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

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
    if (habits.month !== null) parts.push(MONTHS[habits.month]);
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

          {/* Slide 1: Intro */}
          <Text style={styles.yearTitle}>{data.wrapped_year} Wrapped</Text>
          <Text style={styles.yearSubtitle}>Your year in cinema 🎬</Text>

          {/* Slide 2: Total time */}
          <Slide colors={['#FFAFCC', '#FFD700']} title="Time spent watching">
            <Text style={styles.bigNumber}>
              {data.total_hours}<Text style={styles.bigNumberSuffix}> hours</Text>
            </Text>
            <Text style={styles.bigSubtext}>
              That's {data.total_days} days of pure cinema time —
              {data.total_minutes.toLocaleString()} minutes total.
            </Text>
          </Slide>

          {/* Slide 3: Cinema age */}
          {data.cinema_age !== null && (
            <Slide colors={['#5E60CE', '#7400B8']} title="Your cinema age">
              <Text style={styles.bigNumber}>
                {data.cinema_age}<Text style={styles.bigNumberSuffix}> years old</Text>
              </Text>
              <Text style={styles.bigSubtext}>
                The average release year of films you watched is {Math.round(data.avg_release_year ?? 0)}.
                {data.cinema_age > 30 ? ' You love the classics 🎞️' :
                 data.cinema_age > 15 ? ' You appreciate the past decade 📽️' :
                 ' You\'re all about the new stuff 🆕'}
              </Text>
            </Slide>
          )}

          {/* Slide 4: Counts */}
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

          {/* Slide 5: Top genre */}
          {data.top_genre && (
            <Slide colors={['#F72585', '#7209B7']} title="Your top genre">
              <Text style={styles.topName}>{data.top_genre.name}</Text>
              <Text style={styles.topSubtitle}>
                The genre that defined your year in cinema.
              </Text>
            </Slide>
          )}

          {/* Slide 6: Top director */}
          {data.top_director && (
            <Slide colors={['#3A0CA3', '#4361EE']} title="Your top director">
              <Text style={styles.topName}>{data.top_director.name}</Text>
              <Text style={styles.topSubtitle}>
                You watched their work more than anyone else's this year.
              </Text>
            </Slide>
          )}

          {/* Slide 7: Top 5 actors */}
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

          {/* Slide 8: Top movie */}
          {data.top_movie && (
            <Slide colors={['#FFD700', '#FF8C00']} title="Movie of your year">
              <View style={styles.topMovieRow}>
                {data.top_movie.poster_path ? (
                  <Image
                    source={{ uri: `${POSTER_SIZES.medium}${data.top_movie.poster_path}` }}
                    style={styles.topMoviePoster}
                  />
                ) : (
                  <View style={styles.topMoviePoster} />
                )}
                <View style={styles.topMovieInfo}>
                  <Text style={styles.topMovieTitle} numberOfLines={3}>{data.top_movie.title}</Text>
                  <Text style={styles.topMovieRating}>⭐ {data.top_movie.overall_rating}/10</Text>
                  <Text style={styles.topMovieRatingLabel}>your rating</Text>
                </View>
              </View>
            </Slide>
          )}

          {/* Slide 10: Mood */}
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

          {/* Slide 11: Watch habits */}
          {habitsLine.length > 0 && (
            <Slide colors={['#B5179E', '#560BAD']} title="Your cinema ritual">
              <Text style={styles.topName}>
                {habitsLine.join(' · ')}
              </Text>
              <Text style={styles.topSubtitle}>
                When you most often press "Watched" 🍿
              </Text>
            </Slide>
          )}

          {/* Slide 12: Top fan */}
          {data.top_fan && (
            <Slide colors={['#FF006E', '#FFBE0B']} title="Top fan badge">
              <Text style={styles.topName}>{data.top_fan.actor_name}</Text>
              <Text style={styles.topFanLine}>
                You spent <Text style={styles.topFanHighlight}>{data.top_fan.minutes} minutes</Text>
                {' '}with their films this year.
              </Text>
              {data.top_fan.percentile !== null && (
                <Text style={styles.topFanLine}>
                  You're in the
                  <Text style={styles.topFanHighlight}> top {data.top_fan.percentile}% </Text>
                  of their fans on MovieCrush 🏆
                </Text>
              )}
            </Slide>
          )}

          {/* Slide 13: Recompute (у мене воно прибереться, це я юзаю для тестування, бо якщо я дода нові фільми, хочу перезавантажити) */}
          <View style={styles.footerWrap}>
            <TouchableOpacity
              style={styles.recomputeBtn}
              onPress={handleRecompute}
              disabled={isComputing}
              activeOpacity={0.85}
            >
              {isComputing
                ? <ActivityIndicator color={COLORS.white} />
                : <Text style={styles.recomputeText}>Recompute</Text>}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}