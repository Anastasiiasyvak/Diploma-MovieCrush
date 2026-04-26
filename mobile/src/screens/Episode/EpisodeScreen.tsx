import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { TMDB_IMAGE_BASE } from '../../constants/tmdb';
import { SeriesEpisode } from '../../types/series.types';
import { episodeService } from '../../services/episodeService';
import { tmdbSeriesService } from '../../services/tmdbSeriesService';
import { StarRating } from '../../components/movie/StarRating';
import { DetailedRatingSection } from '../../components/movie/DetailedRating';
import { FollowingRatings } from '../../components/follows/FollowingRatings/FollowingRatings';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { movieService } from '../../services/movieService';
import { DetailedRating } from '../../types/movie.types';

const EMPTY_RATING: DetailedRating = {
  overall_rating: null, director_score: null, effects_score: null,
  script_score: null, music_score: null, acting_score: null,
};

const fetchEpisodeDetail = (
  seriesId: number, seasonNumber: number, episodeNumber: number
): Promise<SeriesEpisode> =>
  tmdbSeriesService.getEpisodeDetail(seriesId, seasonNumber, episodeNumber);

// Унікальн айдішка для рейтингу епізоду
const episodeRatingId = (seriesId: number, season: number, episode: number): number =>
  seriesId * 100000 + season * 1000 + episode;

export default function EpisodeScreen({ navigation, route }: any) {
  const { seriesId, seasonNumber, episodeNumber, episodeId } = route.params as {
    seriesId: number;
    seasonNumber: number;
    episodeNumber: number;
    episodeId?: number;
  };

  const ratingId = episodeRatingId(seriesId, seasonNumber, episodeNumber);

  const [episode, setEpisode] = useState<SeriesEpisode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWatched, setIsWatched] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [rating, setRating] = useState<DetailedRating>(EMPTY_RATING);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [resetAlert, setResetAlert] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ep, watched, rat] = await Promise.all([
        fetchEpisodeDetail(seriesId, seasonNumber, episodeNumber),
        episodeService.getWatchedEpisodes(seriesId),
        movieService.getRating(ratingId),
      ]);
      setEpisode(ep);
      setIsWatched(watched.some(
        w => w.season_number === seasonNumber && w.episode_number === episodeNumber
      ));
      setRating(rat);
    } catch (e) {
      console.error('EpisodeScreen load error:', e);
      setError('Could not load episode.');
    } finally {
      setLoading(false);
    }
  }, [seriesId, seasonNumber, episodeNumber, ratingId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleWatchToggle = async () => {
    if (!episode) return;
    setWatchLoading(true);
    try {
      const result = await episodeService.toggleEpisodeWatch({
        series_tmdb_id: seriesId,
        season_number: seasonNumber,
        episode_number: episodeNumber,
        episode_tmdb_id: episodeId ?? episode.id,
      });
      setIsWatched(result.is_watched);
    } catch (e) {
      console.error('toggle watch error:', e);
    } finally {
      setWatchLoading(false);
    }
  };

  const handleRatingChange = async (key: keyof DetailedRating, val: number | null) => {
    const updated = { ...rating, [key]: val };
    setRating(updated);
    setRatingLoading(true);
    try {
      const saved = await movieService.saveRating(ratingId, updated);
      setRating(saved);
      if (key === 'overall_rating' && val !== null && !isWatched) {
        await handleWatchToggle();
      }
    } catch (e) {
      console.error('save episode rating error:', e);
    } finally {
      setRatingLoading(false);
    }
  };

  const handleResetAll = async () => {
    setResetAlert(false);
    setResetLoading(true);
    try {
      await movieService.resetAllRatings(ratingId);
      setRating(EMPTY_RATING);
    } catch (e) {
      console.error('reset episode ratings error:', e);
    } finally {
      setResetLoading(false);
    }
  };

  const hasAnyRating =
    rating.overall_rating !== null || rating.director_score !== null ||
    rating.effects_score !== null || rating.script_score !== null  ||
    rating.music_score !== null || rating.acting_score !== null;

  if (loading) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (error || !episode) {
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

  const stillUrl = episode.still_path
    ? `${TMDB_IMAGE_BASE}/w780${episode.still_path}`
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.stillWrap}>
          {stillUrl ? (
            <Image source={{ uri: stillUrl }} style={styles.still} resizeMode="cover" />
          ) : (
            <View style={[styles.still, styles.stillPlaceholder]}>
              <Text style={{ fontSize: 40 }}>📺</Text>
            </View>
          )}
          <View style={styles.overlayGradient} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inner}>

          <View style={styles.episodeLabelRow}>
            <View style={styles.episodeChip}>
              <Text style={styles.episodeChipText}>S{seasonNumber} E{episodeNumber}</Text>
            </View>
            {episode.air_date && (
              <Text style={styles.metaText}>{episode.air_date}</Text>
            )}
            {episode.runtime && (
              <Text style={styles.metaText}>· {episode.runtime}m</Text>
            )}
          </View>

          <Text style={styles.title}>{episode.name}</Text>

          {episode.vote_average > 0 && (
            <Text style={styles.tmdbRating}>⭐ {episode.vote_average.toFixed(1)} TMDB</Text>
          )}

          <TouchableOpacity
            style={[styles.watchBtn, isWatched && styles.watchBtnActive]}
            onPress={handleWatchToggle}
            disabled={watchLoading}
            activeOpacity={0.8}
          >
            {watchLoading
              ? <ActivityIndicator size="small" color={isWatched ? COLORS.background : COLORS.white} />
              : <Text style={[styles.watchBtnText, isWatched && styles.watchBtnTextActive]}>
                  {isWatched ? '✓ Watched' : 'Mark as Watched'}
                </Text>
            }
          </TouchableOpacity>

          {episode.overview ? (
            <View style={styles.overviewWrap}>
              <Text style={styles.overviewTitle}>Overview</Text>
              <Text style={styles.overview}>{episode.overview}</Text>
            </View>
          ) : null}

          <View style={styles.divider} />

          <FollowingRatings
            tmdbId={ratingId}
            onUserPress={(userId) => navigation.navigate('UserProfile', { userId })}
          />

          <View style={styles.rateSection}>
            <Text style={styles.rateSectionTitle}>Your Rating</Text>
            <StarRating
              value={rating.overall_rating}
              onChange={val => handleRatingChange('overall_rating', val)}
              size={26}
            />
          </View>

          <View style={styles.divider} />

          <DetailedRatingSection
            rating={rating}
            onChange={(key, val) => handleRatingChange(key, val)}
            loading={ratingLoading}
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
                  : <Text style={styles.resetBtnText}>Reset my ratings</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      <CustomAlert
        visible={resetAlert}
        title="Reset ratings?"
        message="This will clear your rating for this episode."
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
  errorText:  {
    fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray,
    textAlign: 'center', paddingHorizontal: 32,
  },
  retryBtn:  {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.gold,
  },
  retryText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.gold },

  stillWrap: {
    width: '100%', aspectRatio: 16 / 9,
    position: 'relative', backgroundColor: COLORS.cardDark,
  },
  still: { width: '100%', height: '100%' },
  stillPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  overlayGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 28,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20, width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontFamily: FONTS.medium, fontSize: 18, color: COLORS.white },

  inner: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  episodeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  episodeChip: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(255,215,0,0.3)',
  },
  episodeChipText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.gold },
  metaText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.cardTextLight },

  title: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.white, lineHeight: 26 },

  tmdbRating: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.gold },

  watchBtn: {
    alignSelf: 'flex-start',
    borderRadius: 20, borderWidth: 1.5, borderColor: '#555',
    paddingVertical: 10, paddingHorizontal: 20,
  },
  watchBtnActive: { backgroundColor: '#00cc66', borderColor: '#00cc66' },
  watchBtnText: { fontFamily: FONTS.semiBold, fontSize: 13, color: '#aaa' },
  watchBtnTextActive: { color: COLORS.background },

  overviewWrap: { gap: 6 },
  overviewTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.white },
  overview: { fontFamily: FONTS.regular, fontSize: 13, color: '#aaa', lineHeight: 20 },

  divider: { height: 0.5, backgroundColor: COLORS.cardDark, marginVertical: 8 },

  rateSection: { alignItems: 'center', gap: 10 },
  rateSectionTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.white },

  resetWrap: { paddingTop: 16, alignItems: 'center' },
  resetBtn: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,77,77,0.4)',
  },
  resetBtnText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.error },
});