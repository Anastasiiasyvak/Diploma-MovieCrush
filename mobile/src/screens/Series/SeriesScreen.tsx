import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { tmdbSeriesService } from '../../services/tmdbSeriesService';
import { movieService } from '../../services/movieService';
import { getAccessToken } from '../../services/storage';
import { CustomAlert } from '../../components/ui/CustomAlert';

import { SeriesHero } from '../../components/series/SeriesHero';
import { SeriesInfo } from '../../components/series/SeriesInfo';
import { SeasonsSection } from '../../components/series/SeasonsSection';
import { SeriesCast, SimilarSeriesRow } from '../../components/series/SeriesCast';
import { MovieActionsBar } from '../../components/movie/MovieActions';
import { MovieGallery } from '../../components/movie/MovieGallery';
import { TrailerButton } from '../../components/movie/TrailerButton';
import { PlatformRatings } from '../../components/movie/MovieCast';
import { CommentsSection } from '../../components/movie/CommentsSection';
import { StarRating } from '../../components/movie/StarRating';
import { MoodPicker } from '../../components/movie/MoodPicker';
import { BestActorPicker } from '../../components/movie/BestActorPicker';
import { DetailedRatingSection } from '../../components/movie/DetailedRating';

import {
  SeriesDetails, SeriesCredits, SeriesImagesResponse,
  SeriesVideosResponse, SimilarSeries,
} from '../../types/series.types';
import {
  MovieActions, DetailedRating, MoodType, UserList,
} from '../../types/movie.types';

type Tab = 'info' | 'rate';

const EMPTY_RATING: DetailedRating = {
  overall_rating: null, director_score: null, effects_score: null,
  script_score: null, music_score: null, acting_score: null,
};


export default function SeriesScreen({ navigation, route }: any) {
  const { seriesId } = route.params as { seriesId: number };

  const [series, setSeries] = useState<SeriesDetails | null>(null);
  const [credits, setCredits] = useState<SeriesCredits | null>(null);
  const [images, setImages] = useState<SeriesImagesResponse>({ backdrops: [], posters: [] });
  const [videos, setVideos] = useState<SeriesVideosResponse>({ results: [] });
  const [similar, setSimilar] = useState<SimilarSeries[]>([]);

  const [actions, setActions] = useState<MovieActions>({ is_favorite: false, is_watchlist: false, is_watched: false, is_disliked: false });
  const [myLists, setMyLists] = useState<UserList[]>([]);
  const [rating, setRating] = useState<DetailedRating>(EMPTY_RATING);
  const [mood, setMood] = useState<MoodType | null>(null);
  const [votedActorId, setVotedActorId]  = useState<number | null>(null);
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
        tmdbSeriesService.getSeriesDetails(seriesId),
        tmdbSeriesService.getSeriesCredits(seriesId),
        tmdbSeriesService.getSeriesImages(seriesId),
        tmdbSeriesService.getSeriesVideos(seriesId),
        tmdbSeriesService.getSimilarSeries(seriesId),
        movieService.getActions(seriesId),
        movieService.getMyLists(),
        movieService.getRating(seriesId),
        movieService.getMood(seriesId),
        movieService.getBestActorVote(seriesId),
      ]);
      setSeries(det);
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
      console.error('SeriesScreen load error:', e);
      setError('Could not load series. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [seriesId]);

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
    useCallback(() => { loadData(); }, [loadData])
  );

  const handleActionsChange = async (updated: MovieActions) => {
    const wasWatched = actions.is_watched;
    const nowWatched = updated.is_watched;
    setActions(updated);
    if (wasWatched && !nowWatched) {
      try {
        await movieService.resetAllRatings(seriesId);
        setRating(EMPTY_RATING);
        setMood(null);
        setVotedActorId(null);
      } catch {}
    }
  };

  const handleRatingChange = async (key: keyof DetailedRating, val: number | null) => {
    const updated = { ...rating, [key]: val };
    setRating(updated);
    setRatingLoading(true);
    try {
      const saved = await movieService.saveRating(seriesId, updated);
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
    setMoodLoading(true);
    try {
      const saved = await movieService.saveMood(seriesId, m);
      setMood(saved);
    } catch (e) {
      console.error('save mood error:', e);
    } finally {
      setMoodLoading(false);
    }
  };

  const handleActorVote = async (actorId: number, actorName: string) => {
    setActorLoading(true);
    try {
      await movieService.voteBestActor(seriesId, actorId, actorName);
      setVotedActorId(actorId);
    } catch (e) {
      console.error('vote actor error:', e);
    } finally {
      setActorLoading(false);
    }
  };

  const handleResetAll = async () => {
    setResetAlert(false);
    setResetLoading(true);
    try {
      await movieService.resetAllRatings(seriesId);
      setRating(EMPTY_RATING);
      setMood(null);
      setVotedActorId(null);
    } catch (e) {
      console.error('reset ratings error:', e);
    } finally {
      setResetLoading(false);
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

  if (error || !series || !credits) {
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

  const castForPicker = credits.cast.map(c => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile_path: c.profile_path,
    order: c.order,
  }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <SeriesHero series={series} onBack={() => navigation.goBack()} />

        <MovieActionsBar
          tmdbId={series.id}
          mediaType="tv"
          actions={actions}
          lists={myLists}
          onActionsChange={handleActionsChange}
        />

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

            <SeriesInfo series={series} />
            <View style={styles.gap} />

            <TrailerButton videos={videos.results} />
            <View style={styles.gap} />

            <PlatformRatings
              tmdbRating={series.vote_average}
              tmdbVotes={series.vote_count}
            />
            <View style={styles.gap} />

            <SeasonsSection
              seasons={series.seasons}
              seriesId={series.id}
              totalEpisodes={series.number_of_episodes}
              navigation={navigation}
            />
            <View style={styles.gap} />

            <MovieGallery images={images.backdrops} />
            <View style={styles.gap} />

            <SeriesCast
              cast={credits.cast}
              onPersonPress={(id, name) =>
                navigation.navigate('Person', { personId: id, personName: name })
              }
            />
            <View style={styles.gap} />

            <SimilarSeriesRow
              series={similar}
              onSeriesPress={id => navigation.navigate('Series', { seriesId: id })}
            />
            <View style={styles.gap} />

            <CommentsSection
              tmdbId={series.id}
              currentUserId={currentUserId}
            />

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
              cast={castForPicker}
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
        message="This will clear your overall rating, detailed scores, mood and best actor vote for this series."
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
  fullCenter: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  scroll: { paddingBottom: 24 },

  errorEmoji: { fontSize: 40 },
  errorText: {
    fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray,
    textAlign: 'center', paddingHorizontal: 32,
  },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.gold,
  },
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

  divider: {
    height: 0.5, backgroundColor: COLORS.cardDark,
    marginHorizontal: 16, marginVertical: 20,
  },

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