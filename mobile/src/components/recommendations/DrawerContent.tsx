import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import {
  CONTENT_TYPES, DECADES, COUNTRIES,
} from '../../constants/genres';
import { FilterChip } from './FilterChip';
import { RatingChips } from './RatingChips';
import { ContentType, FilterState } from '../../types/tmdb.types';

interface DrawerContentProps {
  pending: FilterState;
  visibleGenres: { id: number; name: string }[];
  toggleContentType: (k: ContentType) => void;
  toggleGenre: (id: number) => void;
  toggleDecade: (lbl: string) => void;
  toggleCountry: (code: string) => void;
  setPending: React.Dispatch<React.SetStateAction<FilterState>>;
  applyFilters: () => void;
  resetFilters: () => void;
  closeDrawer: () => void;
  scrollY: React.RefObject<number>;
}

export const DrawerContent: React.FC<DrawerContentProps> = ({
  pending, visibleGenres,
  toggleContentType, toggleGenre, toggleDecade, toggleCountry,
  setPending, applyFilters, resetFilters, closeDrawer,
  scrollY,
}) => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: scrollY.current, animated: false });
  });

  return (
    <View style={styles.drawerInner}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>Filters</Text>
        <TouchableOpacity onPress={closeDrawer}>
          <Text style={styles.drawerClose}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        onScroll={e => { scrollY.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        {/* Content type */}
        <Text style={styles.sectionLabel}>Content type</Text>
        <View style={styles.chipRow}>
          {CONTENT_TYPES.map(ct => (
            <FilterChip
              key={ct.key}
              label={`${ct.emoji} ${ct.label}`}
              active={pending.contentTypes.includes(ct.key)}
              onPress={() => toggleContentType(ct.key)}
            />
          ))}
        </View>

        {/* Genres */}
        <Text style={styles.sectionLabel}>Genres</Text>
        <View style={styles.chipRow}>
          {visibleGenres.map(g => (
            <FilterChip
              key={g.id}
              label={g.name}
              active={pending.genreIds.includes(g.id)}
              onPress={() => toggleGenre(g.id)}
            />
          ))}
        </View>

        {/* Decade */}
        <Text style={styles.sectionLabel}>Decade</Text>
        <View style={styles.chipRow}>
          {DECADES.map(d => (
            <FilterChip
              key={d.label}
              label={d.label}
              active={pending.decades.includes(d.label)}
              onPress={() => toggleDecade(d.label)}
            />
          ))}
        </View>

        {/* Country */}
        <Text style={styles.sectionLabel}>Country</Text>
        <View style={styles.chipRow}>
          {COUNTRIES.map(c => (
            <FilterChip
              key={c.code}
              label={c.name}
              active={pending.countries.includes(c.code)}
              onPress={() => toggleCountry(c.code)}
            />
          ))}
        </View>

        {/* Rating */}
        <Text style={styles.sectionLabel}>Rating</Text>
        <RatingChips
          min={pending.ratingMin}
          max={pending.ratingMax}
          onChange={(mn, mx) => setPending(p => ({ ...p, ratingMin: mn, ratingMax: mx }))}
        />

        {/* Buttons */}
        <View style={styles.footerRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
            <Text style={styles.resetBtnText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
            <Text style={styles.applyBtnText}>Apply filters</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerInner:  { flex: 1 },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1f1f1f',
  },
  drawerTitle: { fontFamily: FONTS.semiBold, fontSize: 18, color: COLORS.white },
  drawerClose: { fontSize: 18, color: '#888888', paddingHorizontal: 4 },

  sectionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 7,
  },

  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    marginHorizontal: 16,
  },
  resetBtn: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
  },
  resetBtnText: { fontFamily: FONTS.medium, fontSize: 14, color: '#888888' },
  applyBtn: {
    flex: 2,
    backgroundColor: COLORS.pink,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  applyBtnText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.background },
});