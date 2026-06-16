import React from 'react';
import {
  View, Text, Image, TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { styles } from './SeriesHero.styles';
import { TMDB_IMAGE_BASE } from '../../constants/tmdb';
import { SeriesDetails } from '../../types/series.types';

interface Props {
  series: SeriesDetails;
  onBack: () => void;
}

const statusColor = (status: string): string => {
  if (status === 'Returning Series') return COLORS.success ?? '#00cc66';
  if (status === 'Ended') return COLORS.cardTextLight;
  if (status === 'Canceled') return COLORS.error;
  return COLORS.gray;
};

export const SeriesHero: React.FC<Props> = ({ series, onBack }) => {
  const backdropUrl = series.backdrop_path
    ? `${TMDB_IMAGE_BASE}/w780${series.backdrop_path}`
    : null;
  const posterUrl = series.poster_path
    ? `${TMDB_IMAGE_BASE}/w342${series.poster_path}`
    : null;

  const year = series.first_air_date?.slice(0, 4) ?? '—';
  const stars = Math.round(series.vote_average / 2);
  const avgRuntime = series.episode_run_time?.[0];

  return (
    <View>
      <View style={styles.backdropWrap}>
        {backdropUrl ? (
          <Image source={{ uri: backdropUrl }} style={styles.backdrop} resizeMode="cover" />
        ) : (
          <View style={[styles.backdrop, styles.backdropPlaceholder]} />
        )}
        <View style={styles.backdropOverlay} />

        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={[styles.statusBadge, { borderColor: statusColor(series.status) }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor(series.status) }]} />
          <Text style={[styles.statusText, { color: statusColor(series.status) }]}>
            {series.status}
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.posterWrap}>
          {posterUrl ? (
            <Image source={{ uri: posterUrl }} style={styles.poster} resizeMode="cover" />
          ) : (
            <View style={styles.posterPlaceholder}>
              <Text style={{ fontSize: 32 }}>📺</Text>
            </View>
          )}
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={3}>{series.name}</Text>

          {series.tagline ? (
            <Text style={styles.tagline} numberOfLines={2}>"{series.tagline}"</Text>
          ) : null}

          <Text style={styles.year}>{year}</Text>

          <View style={styles.starRow}>
            {[1,2,3,4,5].map(i => (
              <Text key={i} style={[styles.starIcon, { opacity: i <= stars ? 1 : 0.25 }]}>★</Text>
            ))}
            <Text style={styles.ratingNum}> {series.vote_average.toFixed(1)}</Text>
          </View>
          <Text style={styles.voteCount}>{series.vote_count.toLocaleString()} votes</Text>

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                🎬 {series.number_of_seasons} season{series.number_of_seasons !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                📺 {series.number_of_episodes} ep.
              </Text>
            </View>
            {avgRuntime ? (
              <View style={styles.chip}>
                <Text style={styles.chipText}>⏱ ~{avgRuntime}m</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};