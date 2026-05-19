import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Image,
  ScrollView, ActivityIndicator, Animated, PanResponder,
  Dimensions, StatusBar,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import {
  onboardingService,
  OnboardingActor,
  OnboardingMovie,
} from '../../services/onboardingService';
import { styles } from './OnboardingScreen.styles';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_W * 0.3;

type Step = 'actors' | 'swipe' | 'rating' | 'done';

const ProgressBar = ({ step }: { step: Step }) => {
  const steps: Step[] = ['actors', 'swipe', 'rating'];
  const idx = steps.indexOf(step);
  return (
    <View style={styles.progressWrap}>
      {steps.map((s, i) => (
        <View key={s} style={[styles.progressDot, i <= idx && styles.progressDotActive]} />
      ))}
    </View>
  );
};

const StarRow = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
      <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 8, bottom: 8, left: 3, right: 3 }}>
        <Text style={[styles.star, n <= value && styles.starActive]}>{n <= value ? '★' : '☆'}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function OnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('actors');
  const [actors, setActors] = useState<OnboardingActor[]>([]);
  const [movies, setMovies] = useState<OnboardingMovie[]>([]);
  const [likedActors, setLikedActors] = useState<Set<number>>(new Set());
  const [watchedIds, setWatchedIds] = useState<number[]>([]);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [movieIdx, setMovieIdx] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const swipeX = useRef(new Animated.Value(0)).current;
  const swipeY = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  const movieIdxRef = useRef(0);
  const watchedIdsRef = useRef<number[]>([]);
  const moviesRef = useRef<OnboardingMovie[]>([]);
  const currentBatchRef = useRef(1);

  movieIdxRef.current = movieIdx;
  watchedIdsRef.current = watchedIds;
  moviesRef.current = movies;
  currentBatchRef.current = currentBatch;

  useEffect(() => {
    (async () => {
      try {
        const content = await onboardingService.getContent(1);
        setActors(content.actors);
        setMovies(content.movies);
        moviesRef.current = content.movies;
      } catch (e) {
        console.error('Failed to load onboarding content:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (step === 'swipe') {
      swipeX.setValue(0);
      swipeY.setValue(0);
      cardOpacity.setValue(1);
    }
  }, [movieIdx, step]);

  const advanceMovie = (direction: 'watched' | 'not_watched') => {
    const currentMovies = moviesRef.current;
    const idx = movieIdxRef.current;
    const movie = currentMovies[idx];
    if (!movie) return;

    const newWatched =
      direction === 'watched'
        ? [...watchedIdsRef.current, movie.tmdb_id]
        : [...watchedIdsRef.current];

    if (direction === 'watched') {
      setWatchedIds(newWatched);
      watchedIdsRef.current = newWatched;
    }

    const nextIdx = idx + 1;

    if (nextIdx >= currentMovies.length) {
      if (newWatched.length === 0) {
        loadNextBatch();
      } else {
        setStep('rating');
      }
    } else {
      setMovieIdx(nextIdx);
      movieIdxRef.current = nextIdx;
    }
  };

  const animateAndAdvance = (direction: 'watched' | 'not_watched') => {
    const toX = direction === 'watched' ? SCREEN_W * 1.5 : -SCREEN_W * 1.5;
    Animated.parallel([
      Animated.timing(swipeX, { toValue: toX, duration: 260, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => advanceMovie(direction));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => {
        swipeX.setValue(g.dx);
        swipeY.setValue(g.dy * 0.25);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          animateAndAdvance('watched');
        } else if (g.dx < -SWIPE_THRESHOLD) {
          animateAndAdvance('not_watched');
        } else {
          Animated.spring(swipeX, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
          Animated.spring(swipeY, { toValue: 0, useNativeDriver: true, friction: 6 }).start();
        }
      },
    })
  ).current;

  const loadNextBatch = async () => {
    setLoading(true);
    try {
      const nextBatch = currentBatchRef.current + 1;
      const content = await onboardingService.getContent(nextBatch);
      if (content.movies.length === 0) {
        setStep('rating');
        return;
      }
      setMovies(content.movies);
      moviesRef.current = content.movies;
      setMovieIdx(0);
      movieIdxRef.current = 0;
      setCurrentBatch(nextBatch);
      currentBatchRef.current = nextBatch;
    } catch {
      setStep('rating');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await onboardingService.complete({
        liked_actor_ids: Array.from(likedActors),
        watched_tmdb_ids: watchedIds,
        ratings,
      });
    } catch (e) {
      console.error('Failed to save onboarding:', e);
    } finally {
      setSaving(false);
      setStep('done');
    }
  };

  const goToHome = () => navigation.reset({ index: 0, routes: [{ name: 'Home' }] });

  const toggleActor = (tmdbId: number) => {
    setLikedActors(prev => {
      const next = new Set(prev);
      next.has(tmdbId) ? next.delete(tmdbId) : next.add(tmdbId);
      return next;
    });
  };

  const watchedMovies = movies.filter(m => watchedIds.includes(m.tmdb_id));

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.pink} />
      </View>
    );
  }

  if (step === 'actors') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <ProgressBar step={step} />
        <Text style={styles.heading}>Who do you love watching? 🎬</Text>
        <Text style={styles.subheading}>Pick all the actors you enjoy</Text>

        <ScrollView contentContainerStyle={styles.actorGrid} showsVerticalScrollIndicator={false}>
          {actors.map(actor => {
            const selected = likedActors.has(actor.tmdb_id);
            return (
              <TouchableOpacity
                key={actor.tmdb_id}
                style={[styles.actorCard, selected && styles.actorCardSelected]}
                onPress={() => toggleActor(actor.tmdb_id)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: onboardingService.getActorPhotoUrl(actor.photo_path) }}
                  style={styles.actorPhoto}
                />
                {selected && (
                  <View style={styles.actorCheckOverlay}>
                    <Text style={styles.actorCheck}>✓</Text>
                  </View>
                )}
                <Text style={styles.actorName} numberOfLines={1}>{actor.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.bottomBar}>
          {likedActors.size === 0 ? (
            <TouchableOpacity style={styles.noneBtn} onPress={() => setStep('swipe')}>
              <Text style={styles.noneBtnText}>None of them →</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text style={styles.selectedCount}>{likedActors.size} selected</Text>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep('swipe')}>
                <Text style={styles.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  if (step === 'swipe') {
    const movie = movies[movieIdx];
    if (!movie) return null;

    const rotate = swipeX.interpolate({
      inputRange: [-SCREEN_W, 0, SCREEN_W],
      outputRange: ['-12deg', '0deg', '12deg'],
    });
    const watchedOverlay = swipeX.interpolate({
      inputRange: [30, SWIPE_THRESHOLD],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
    const nopeOverlay = swipeX.interpolate({
      inputRange: [-SWIPE_THRESHOLD, -30],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <ProgressBar step={step} />
        <Text style={styles.heading}>Have you seen this? 🍿</Text>
        <Text style={styles.subheading}>Swipe right if watched · left if not</Text>

        <Text style={styles.swipeCounter}>{movieIdx + 1} / {movies.length}</Text>

        <Animated.View
          style={[
            styles.swipeCard,
            {
              opacity: cardOpacity,
              transform: [{ translateX: swipeX }, { translateY: swipeY }, { rotate }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: onboardingService.getMoviePosterUrl(movie.poster_path) }}
            style={styles.moviePoster}
            resizeMode="cover"
          />

          <Animated.View style={[styles.swipeOverlay, styles.overlayRight, { opacity: watchedOverlay }]}>
            <Text style={styles.overlayText}>WATCHED ✓</Text>
          </Animated.View>

          <Animated.View style={[styles.swipeOverlay, styles.overlayLeft, { opacity: nopeOverlay }]}>
            <Text style={styles.overlayText}>NOPE ✕</Text>
          </Animated.View>

          <View style={styles.movieInfo}>
            <Text style={styles.movieTitle}>{movie.title}</Text>
            <Text style={styles.movieMeta}>
              {movie.year} · {movie.genre} · {movie.media_type === 'tv' ? '📺 Series' : '🎬 Movie'}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.swipeBtns}>
          <TouchableOpacity
            style={[styles.swipeBtn, styles.swipeBtnNo]}
            onPress={() => animateAndAdvance('not_watched')}
          >
            <Text style={styles.swipeBtnIcon}>✕</Text>
            <Text style={styles.swipeBtnLabel}>Not seen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.swipeBtn, styles.swipeBtnYes]}
            onPress={() => animateAndAdvance('watched')}
          >
            <Text style={styles.swipeBtnIcon}>✓</Text>
            <Text style={styles.swipeBtnLabel}>Watched!</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (step === 'rating') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <ProgressBar step={step} />
        <Text style={styles.heading}>Rate what you watched ⭐</Text>
        <Text style={styles.subheading}>
          {watchedMovies.length > 0
            ? 'How would you score these?'
            : "Looks like you haven't seen these — no worries!"}
        </Text>

        <ScrollView contentContainerStyle={styles.ratingList} showsVerticalScrollIndicator={false}>
          {watchedMovies.map(movie => (
            <View key={movie.tmdb_id} style={styles.ratingRow}>
              <Image
                source={{ uri: onboardingService.getMoviePosterUrl(movie.poster_path) }}
                style={styles.ratingPoster}
              />
              <View style={styles.ratingInfo}>
                <Text style={styles.ratingTitle} numberOfLines={1}>{movie.title}</Text>
                <Text style={styles.ratingYear}>{movie.year}</Text>
                <StarRow
                  value={ratings[movie.tmdb_id] ?? 0}
                  onChange={v => setRatings(prev => ({ ...prev, [movie.tmdb_id]: v }))}
                />
              </View>
            </View>
          ))}

          {watchedMovies.length === 0 && (
            <View style={styles.emptyRating}>
              <Text style={styles.emptyEmoji}>🎬</Text>
              <Text style={styles.emptyText}>
                No worries — we'll personalize your feed as you watch more
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleFinish} disabled={saving}>
            {saving
              ? <ActivityIndicator color={COLORS.background} />
              : <Text style={styles.nextBtnText}>Finish →</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <StatusBar barStyle="light-content" />
      <Text style={styles.doneEmoji}>🎬</Text>
      <Text style={styles.doneTitle}>You're all set!</Text>
      <Text style={styles.doneSub}>
        Your personalized feed is ready.{'\n'}Time to explore MovieCrush!
      </Text>
      <TouchableOpacity style={styles.doneBtn} onPress={goToHome}>
        <Text style={styles.doneBtnText}>Let's go 🍿</Text>
      </TouchableOpacity>
    </View>
  );
}