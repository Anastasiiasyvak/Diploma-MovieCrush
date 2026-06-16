import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  ActivityIndicator, LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { TMDB_IMAGE_BASE } from '../../constants/tmdb';
import { SeriesSeason, SeriesSeasonDetail, SeriesEpisode } from '../../types/series.types';
import { tmdbSeriesService } from '../../services/tmdbSeriesService';
import { episodeService, WatchedEpisode } from '../../services/episodeService';
import { styles } from './SeasonsSection.styles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}


const WatchedIcon: React.FC<{ watched: boolean; loading: boolean; onPress: () => void }> = ({
  watched, loading, onPress,
}) => (
  <TouchableOpacity
    style={[styles.watchedBtn, watched && styles.watchedBtnActive]}
    onPress={onPress}
    activeOpacity={0.7}
    disabled={loading}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  >
    {loading
      ? <ActivityIndicator size="small" color={watched ? COLORS.background : COLORS.gray} style={{ width: 16, height: 16 }} />
      : <Text style={[styles.watchedBtnText, watched && styles.watchedBtnTextActive]}>
          {watched ? '✓' : '–'}
        </Text>
    }
  </TouchableOpacity>
);

interface EpisodeRowProps {
  episode: SeriesEpisode;
  seriesId: number;
  totalEpisodes: number;
  isWatched: boolean;
  onWatchToggle: (ep: SeriesEpisode, newVal: boolean) => void;
  onPress: (ep: SeriesEpisode) => void;
}

const EpisodeRow: React.FC<EpisodeRowProps> = ({
  episode, seriesId, totalEpisodes, isWatched, onWatchToggle, onPress,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  const stillUrl = episode.still_path
    ? `${TMDB_IMAGE_BASE}/w300${episode.still_path}`
    : null;

  const handleWatchToggle = async () => {
    setWatchLoading(true);
    try {
      const result = await episodeService.toggleEpisodeWatch({
        series_tmdb_id: seriesId,
        season_number: episode.season_number,
        episode_number: episode.episode_number,
        episode_tmdb_id: episode.id,
        total_episodes_in_series: totalEpisodes,
      });
      onWatchToggle(episode, result.is_watched);
    } catch (e) {
      console.error('toggle episode watch error:', e);
    } finally {
      setWatchLoading(false);
    }
  };

  return (
    <View style={[styles.episodeRow, isWatched && styles.episodeRowWatched]}>
      <TouchableOpacity
        style={styles.episodeLeft}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded(p => !p);
        }}
        activeOpacity={0.8}
      >
        <View style={styles.stillWrap}>
          {stillUrl ? (
            <Image source={{ uri: stillUrl }} style={styles.still} resizeMode="cover" />
          ) : (
            <View style={styles.stillPlaceholder}>
              <Text style={{ fontSize: 14 }}>📺</Text>
            </View>
          )}
          <View style={styles.epNumBadge}>
            <Text style={styles.epNumText}>E{episode.episode_number}</Text>
          </View>
        </View>

        <View style={styles.episodeInfo}>
          <Text style={[styles.episodeName, isWatched && styles.episodeNameWatched]}
            numberOfLines={expanded ? undefined : 1}>
            {episode.name}
          </Text>
          <View style={styles.episodeMeta}>
            {episode.air_date && (
              <Text style={styles.episodeDateText}>{episode.air_date.slice(0, 10)}</Text>
            )}
            {episode.runtime && (
              <Text style={styles.episodeMisc}>· {episode.runtime}m</Text>
            )}
            {episode.vote_average > 0 && (
              <Text style={styles.episodeMisc}>· ⭐ {episode.vote_average.toFixed(1)}</Text>
            )}
          </View>
          {expanded && episode.overview ? (
            <Text style={styles.episodeOverview}>{episode.overview}</Text>
          ) : null}
          {expanded && (
            <TouchableOpacity
              onPress={() => onPress(episode)}
              style={styles.detailsBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.detailsBtnText}>View episode details →</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      <WatchedIcon
        watched={isWatched}
        loading={watchLoading}
        onPress={handleWatchToggle}
      />
    </View>
  );
};


interface SeasonItemProps {
  season: SeriesSeason;
  seriesId: number;
  totalEpisodes: number;
  watchedSet: Set<string>;
  onWatchToggle: (ep: SeriesEpisode, newVal: boolean) => void;
  onEpisodePress: (ep: SeriesEpisode, seriesId: number) => void;
}

const SeasonItem: React.FC<SeasonItemProps> = ({
  season, seriesId, totalEpisodes, watchedSet, onWatchToggle, onEpisodePress,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<SeriesSeasonDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const posterUrl = season.poster_path
    ? `${TMDB_IMAGE_BASE}/w185${season.poster_path}`
    : null;

  const watchedInSeason = detail
    ? detail.episodes.filter(ep =>
        watchedSet.has(`${season.season_number}x${ep.episode_number}`)
      ).length
    : 0;

  const handleToggle = useCallback(async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!expanded && !detail) {
      setLoading(true);
      try {
        const data = await tmdbSeriesService.getSeasonDetail(seriesId, season.season_number);
        setDetail(data);
      } catch (e) {
        console.error('season detail error:', e);
      } finally {
        setLoading(false);
      }
    }
    setExpanded(p => !p);
  }, [expanded, detail, seriesId, season.season_number]);

  return (
    <View style={styles.seasonWrap}>
      <TouchableOpacity
        style={[styles.seasonHeader, expanded && styles.seasonHeaderExpanded]}
        onPress={handleToggle}
        activeOpacity={0.8}
      >
        <View style={styles.seasonPosterWrap}>
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.seasonPoster} resizeMode="cover" />
          ) : (
            <View style={styles.seasonPosterPlaceholder}>
              <Text style={{ fontSize: 18 }}>📺</Text>
            </View>
          )}
        </View>

        <View style={styles.seasonInfo}>
          <Text style={styles.seasonName}>{season.name}</Text>
          <Text style={styles.seasonMeta}>
            {season.episode_count} ep.
            {season.air_date ? ` · ${season.air_date.slice(0, 4)}` : ''}
            {season.vote_average > 0 ? ` · ⭐ ${season.vote_average.toFixed(1)}` : ''}
          </Text>
          {detail && (
            <Text style={styles.seasonProgress}>
              {watchedInSeason}/{detail.episodes.length} watched
            </Text>
          )}
        </View>

        <Text style={styles.seasonChevron}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.episodesList}>
          {loading ? (
            <View style={styles.episodesLoader}>
              <ActivityIndicator size="small" color={COLORS.gold} />
              <Text style={styles.episodesLoadingText}>Loading episodes…</Text>
            </View>
          ) : detail ? (
            <>
              {detail.overview ? (
                <Text style={styles.seasonFullOverview}>{detail.overview}</Text>
              ) : null}
              {detail.episodes.map(ep => (
                <EpisodeRow
                  key={`${season.season_number}x${ep.episode_number}`}
                  episode={ep}
                  seriesId={seriesId}
                  totalEpisodes={totalEpisodes}
                  isWatched={watchedSet.has(`${season.season_number}x${ep.episode_number}`)}
                  onWatchToggle={onWatchToggle}
                  onPress={ep => onEpisodePress(ep, seriesId)}
                />
              ))}
            </>
          ) : null}
        </View>
      )}
    </View>
  );
};

interface Props {
  seasons: SeriesSeason[];
  seriesId: number;
  totalEpisodes: number;
  navigation:  any;
}

export const SeasonsSection: React.FC<Props> = ({
  seasons, seriesId, totalEpisodes, navigation,
}) => {
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set());
  const [loadingWatched, setLoadingWatched] = useState(true);

  useEffect(() => {
    loadWatched();
  }, [seriesId]);

  const loadWatched = async () => {
    try {
      const data = await episodeService.getWatchedEpisodes(seriesId);
      const s = new Set<string>(
        data.map((e: WatchedEpisode) => `${e.season_number}x${e.episode_number}`)
      );
      setWatchedSet(s);
    } catch (e) {
      console.error('load watched episodes error:', e);
    } finally {
      setLoadingWatched(false);
    }
  };

  const handleWatchToggle = (ep: SeriesEpisode, newVal: boolean) => {
    const key = `${ep.season_number}x${ep.episode_number}`;
    setWatchedSet(prev => {
      const s = new Set(prev);
      if (newVal) s.add(key);
      else s.delete(key);
      return s;
    });
  };

  const handleEpisodePress = (ep: SeriesEpisode, sId: number) => {
    navigation.navigate('Episode', {
      seriesId: sId,
      seasonNumber: ep.season_number,
      episodeNumber: ep.episode_number,
      episodeId: ep.id,
    });
  };

  const sorted = [...seasons].sort((a, b) => {
    if (a.season_number === 0) return 1;
    if (b.season_number === 0) return -1;
    return a.season_number - b.season_number;
  });

  const totalWatched = watchedSet.size;

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>Seasons & Episodes</Text>
        {!loadingWatched && totalWatched > 0 && (
          <Text style={styles.totalWatched}>
            {totalWatched}/{totalEpisodes} watched
          </Text>
        )}
      </View>

      <View style={styles.list}>
        {sorted.map(season => (
          <SeasonItem
            key={`season-${season.season_number}`}
            season={season}
            seriesId={seriesId}
            totalEpisodes={totalEpisodes}
            watchedSet={watchedSet}
            onWatchToggle={handleWatchToggle}
            onEpisodePress={handleEpisodePress}
          />
        ))}
      </View>
    </View>
  );
};