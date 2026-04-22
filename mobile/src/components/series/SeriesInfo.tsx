import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { SeriesDetails } from '../../types/series.types';

interface Props {
  series: SeriesDetails;
}

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export const SeriesInfo: React.FC<Props> = ({ series }) => {
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  const creators = series.created_by?.map(c => c.name).join(', ') || '—';
  const genres = series.genres?.map(g => g.name).join(', ') || '—';
  const country = series.production_countries?.[0]?.name ?? '—';
  const networks = series.networks?.map(n => n.name).join(', ') || '—';
  const lastYear = series.last_air_date?.slice(0, 4);
  const firstYear = series.first_air_date?.slice(0, 4) ?? '—';
  const yearsStr = lastYear && lastYear !== firstYear
    ? `${firstYear} – ${lastYear}`
    : firstYear;

  const overview = series.overview || 'No description available.';
  const isLong = overview.length > 200;

  return (
    <View style={styles.wrap}>
      {creators !== '—' && <Row label="🎬 Creator"  value={creators} />}
      <Row label="📅 Years"   value={yearsStr} />
      <Row label="🎭 Genre"   value={genres} />
      <Row label="🌍 Country" value={country} />
      {networks !== '—' && <Row label="📡 Network" value={networks} />}

      <View style={styles.overviewWrap}>
        <Text style={styles.overviewTitle}>Overview</Text>
        <Text style={styles.overviewText}>
          {isLong && !overviewExpanded ? overview.slice(0, 200) + '…' : overview}
        </Text>
        {isLong && (
          <TouchableOpacity
            onPress={() => setOverviewExpanded(p => !p)}
            activeOpacity={0.7}
          >
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