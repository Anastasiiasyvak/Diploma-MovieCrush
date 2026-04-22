import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { MovieDetails, MovieCredits } from '../../types/movie.types';

interface Props {
  movie: MovieDetails;
  credits: MovieCredits;
}

const formatRuntime = (minutes: number | null): string => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export const MovieInfo: React.FC<Props> = ({ movie, credits }) => {
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  const director = credits.crew.find(c => c.job === 'Director');
  const writers = credits.crew
    .filter(c => c.job === 'Screenplay' || c.job === 'Writer' || c.job === 'Story')
    .slice(0, 3)
    .map(c => c.name)
    .join(', ');

  const genres = movie.genres.map(g => g.name).join(', ') || '—';
  const country = movie.production_countries[0]?.name ?? '—';
  const overview = movie.overview || 'No description available.';
  const isLong = overview.length > 200;

  return (
    <View style={styles.wrap}>
      <Row label="⏱ Runtime" value={formatRuntime(movie.runtime)} />
      <Row label="🎬 Director" value={director?.name ?? '—'} />
      {writers ? <Row label="✍️ Writers"  value={writers} /> : null}
      <Row label="📅 Year" value={movie.release_date?.slice(0, 4) ?? '—'} />
      <Row label="🎭 Genre" value={genres} />
      <Row label="🌍 Country" value={country} />

      <View style={styles.overviewWrap}>
        <Text style={styles.overviewTitle}>Overview</Text>
        <Text style={styles.overviewText}>
          {isLong && !overviewExpanded ? overview.slice(0, 200) + '…' : overview}
        </Text>
        {isLong && (
          <TouchableOpacity onPress={() => setOverviewExpanded(p => !p)} activeOpacity={0.7}>
            <Text style={styles.readMore}>
              {overviewExpanded ? 'Show less ↑' : 'Read more ↓'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, gap: 10 },

  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.gray,
    width: 90,
    flexShrink: 0,
  },
  infoValue: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.white,
    flex: 1,
    lineHeight: 18,
  },

  overviewWrap: { marginTop: 8, gap: 6 },
  overviewTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.white },
  overviewText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#aaaaaa',
    lineHeight: 20,
  },
  readMore: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.gold, marginTop: 4 },
});