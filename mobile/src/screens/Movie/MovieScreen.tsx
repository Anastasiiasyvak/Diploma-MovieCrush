import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { tmdbMovieService } from '../../services/tmdbMovieService';
import { movieService } from '../../services/movieService';
import { getAccessToken } from '../../services/storage';
import { CustomAlert } from '../../components/ui/CustomAlert';

import { MovieHero } from '../../components/movie/MovieHero';
import { MovieActionsBar } from '../../components/movie/MovieActions';
import { MovieInfo } from '../../components/movie/MovieInfo';
import { MovieGallery } from '../../components/movie/MovieGallery';
import { TrailerButton } from '../../components/movie/TrailerButton';
import { MovieCast, SimilarMovies, PlatformRatings } from '../../components/movie/MovieCast';
import { CommentsSection } from '../../components/movie/CommentsSection';
import { StarRating } from '../../components/movie/StarRating';
import { MoodPicker } from '../../components/movie/MoodPicker';
import { BestActorPicker } from '../../components/movie/BestActorPicker';
import { DetailedRatingSection } from '../../components/movie/DetailedRating';
import { FollowingRatings } from '../../components/follows/FollowingRatings';

import {
  MovieDetails, MovieCredits, MovieImagesResponse,
  MovieVideosResponse, SimilarMovie, MovieActions,
  DetailedRating, MoodType, UserList,
} from '../../types/movie.types';

type Tab = 'info' | 'rate';

const EMPTY_RATING: DetailedRating = {
  overall_rating: null, director_score: null, effects_score: null,
  script_score: null, music_score: null, acting_score: null,
};

export default function MovieScreen({ navigation, route }: any) {
  const { movieId } = route.params as { movieId: number };

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [credits, setCredits] = useState<MovieCredits | null>(null);
  const [images, setImages] = useState<MovieImagesResponse>({ backdrops: [], posters: [] });
  const [videos, setVideos] = useState<MovieVideosResponse>({ results: [] });
  const [similar, setSimilar] = useState<SimilarMovie[]>([]);

  const [actions, setActions] = useState<MovieActions>({ is_favorite: false, is_watchlist: false, is_watched: false, is_disliked: false });
  const [myLists, setMyLists] = useState<UserList[]>([]);
  const [rating, setRating] = useState<DetailedRating>(EMPTY_RATING);
  const [mood, setMood] = useState<MoodType | null>(null);
  const [votedActorId, setVotedActorId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [moodLoading, setMoodLoading] = useState(false);
  const [actorLoading, setActorLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetAlert, setResetAlert] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [det, cred, imgs, vids, sim, act, lists, rat, md, bestActor] = await Promise.all([
        tmdbMovieService.getMovieDetails(movieId),
        tmdbMovieService.getMovieCredits(movieId),
        tmdbMovieService.getMovieImages(movieId),
        tmdbMovieService.getMovieVideos(movieId),
        tmdbMovieService.getSimilarMovies(movieId),
        movieService.getActions(movieId),
        movieService.getMyLists(),
        movieService.getRating(movieId),
        movieService.getMood(movieId),
        movieService.getBestActorVote(movieId),
      ]);
      setMovie(det);
      setCredits(cred);
      setImages(imgs);
      setVideos(vids);
      setSimilar(sim.results);
      setActions(act);
      setMyLists(lists);
      setRating(rat);
      setMood(md);
      setVotedActorId(bestActor.actor_tmdb_id);
    } catch (e) {
      console.error('MovieScreen load error:', e);
      setError('Could not load movie. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [movieId]);

  useEffect(() => {
    const decodeUserId = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.userId);
      } catch {}
    };
    decodeUserId();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRatingChange = async (key: keyof DetailedRating, val: number | null) => {
    if (!movie) return;
    const updated = { ...rating, [key]: val };
    setRating(updated);
    setRatingLoading(true);
    try {
      const saved = await movieService.saveRating(movie.id, updated);
      setRating(saved);
      if (key === 'overall_rating' && val !== null) {
        setActions(prev => ({ ...prev, is_watched: true }));
      }
    } catch (e) {
      console.error('save rating error:', e);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleMoodSelect = async (m: MoodType) => {
    if (!movie) return;
    setMoodLoading(true);
    try {
      const saved = await movieService.saveMood(movie.id, m);
      setMood(saved);
    } catch (e) {
      console.error('save mood error:', e);
    } finally {
      setMoodLoading(false);
    }
  };

  const handleActorVote = async (actorId: number, actorName: string) => {
    if (!movie) return;
    setActorLoading(true);
    try {
      await movieService.voteBestActor(movie.id, actorId, actorName);
      setVotedActorId(actorId);
    } catch (e) {
      console.error('vote actor error:', e);
    } finally {
      setActorLoading(false);
    }
  };

  const handleResetAll = async () => {
    if (!movie) return;
    setResetAlert(false);
    setResetLoading(true);
    try {
      await movieService.resetAllRatings(movie.id);
      setRating(EMPTY_RATING);
      setMood(null);
      setVotedActorId(null);
    } catch (e) {
      console.error('reset ratings error:', e);
    } finally {
      setResetLoading(false);
    }
  };

  const handleActionsChange = async (updated: MovieActions) => {
    const wasWatched = actions.is_watched;
    const nowWatched = updated.is_watched;
    setActions(updated);
    if (wasWatched && !nowWatched && movie) {
      try {
        await movieService.resetAllRatings(movie.id);
        setRating(EMPTY_RATING);
        setMood(null);
        setVotedActorId(null);
      } catch (e) {
        console.error('auto-reset ratings error:', e);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (error || !movie || !credits) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>{error ?? 'Something went wrong'}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadData} activeOpacity={0.8}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasAnyRating =
    rating.overall_rating !== null || rating.director_score !== null ||
    rating.effects_score !== null || rating.script_score !== null  ||
    rating.music_score !== null || rating.acting_score !== null  ||
    mood !== null || votedActorId !== null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <MovieHero movie={movie} onBack={() => navigation.goBack()} />

        <MovieActionsBar
          tmdbId={movie.id}
          actions={actions}
          lists={myLists}
          onActionsChange={handleActionsChange}
        />

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              📋 Info
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'rate' && styles.tabActive]}
            onPress={() => setActiveTab('rate')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'rate' && styles.tabTextActive]}>
              ⭐ Rate
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {activeTab === 'info' && (
          <View style={styles.tabContent}>
            <MovieInfo movie={movie} credits={credits} />
            <View style={styles.gap} />
            <TrailerButton videos={videos.results} />
            <View style={styles.gap} />
            <PlatformRatings tmdbRating={movie.vote_average} tmdbVotes={movie.vote_count} />
            <View style={styles.gap} />
            <FollowingRatings
              tmdbId={movie.id}
              onUserPress={(userId) => navigation.navigate('UserProfile', { userId })}
            />
            <View style={styles.gap} />
            <MovieGallery images={images.backdrops} />
            <View style={styles.gap} />
            <MovieCast
              cast={credits.cast}
              onPersonPress={(id, name) =>
                navigation.navigate('Person', { personId: id, personName: name })
              }
            />
            <View style={styles.gap} />
            <SimilarMovies
              movies={similar}
              onMoviePress={id => navigation.navigate('Movie', { movieId: id })}
            />
            <View style={styles.gap} />
            <CommentsSection tmdbId={movie.id} currentUserId={currentUserId} />
          </View>
        )}

        {activeTab === 'rate' && (
          <View style={styles.tabContent}>

            <View style={styles.rateSection}>
              <Text style={styles.rateSectionTitle}>Your Rating</Text>
              <StarRating
                value={rating.overall_rating}
                onChange={val => handleRatingChange('overall_rating', val)}
                size={28}
              />
            </View>

            <View style={styles.divider} />

            <DetailedRatingSection
              rating={rating}
              onChange={(key, val) => handleRatingChange(key, val)}
              loading={ratingLoading}
            />

            <View style={styles.divider} />

            <MoodPicker
              selected={mood}
              onSelect={handleMoodSelect}
              loading={moodLoading}
            />

            <View style={styles.divider} />

            <BestActorPicker
              cast={credits.cast}
              votedActorId={votedActorId}
              onVote={handleActorVote}
              loading={actorLoading}
            />

            {hasAnyRating && (
              <View style={styles.resetWrap}>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => setResetAlert(true)}
                  activeOpacity={0.7}
                  disabled={resetLoading}
                >
                  {resetLoading
                    ? <ActivityIndicator size="small" color={COLORS.error} />
                    : <Text style={styles.resetBtnText}>Reset all my ratings</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 40 }} />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <CustomAlert
        visible={resetAlert}
        title="Reset all ratings?"
        message="This will clear your overall rating, detailed scores, mood and best actor vote for this movie."
        onConfirm={handleResetAll}
        onCancel={() => setResetAlert(false)}
        confirmText="Reset"
        cancelText="Cancel"
        confirmStyle="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  fullCenter: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scroll: { paddingBottom: 24 },

  errorEmoji: { fontSize: 40 },
  errorText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.gold },
  retryText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.gold },

  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.cardDark,
    alignItems: 'center', backgroundColor: COLORS.cardBg,
  },
  tabActive: { backgroundColor: 'rgba(255,215,0,0.12)', borderColor: 'rgba(255,215,0,0.5)' },
  tabText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.gray },
  tabTextActive: { color: COLORS.gold },

  divider: { height: 0.5, backgroundColor: COLORS.cardDark, marginHorizontal: 16, marginVertical: 20 },

  tabContent: { gap: 0 },
  gap: { height: 24 },

  rateSection: { paddingHorizontal: 16, alignItems: 'center', gap: 12 },
  rateSectionTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.white },

  resetWrap: { paddingHorizontal: 16, paddingTop: 24, alignItems: 'center' },
  resetBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.4)',
  },
  resetBtnText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.error },
});