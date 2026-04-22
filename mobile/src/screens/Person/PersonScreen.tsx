import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, ActivityIndicator, Dimensions,
  StatusBar, Platform, FlatList,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { TMDB_IMAGE_BASE } from '../../constants/tmdb';
import { tmdbService } from '../../services/tmdbService';
import { FilmographyCard } from '../../components/person/FilmographyCard';
import { PersonDetails, PersonCredits, CastCredit, CrewCredit } from '../../types/person.types';

const MAX_WIDTH = 480;
const PHOTO_SIZE = 110;
const PROFILE_URL = `${TMDB_IMAGE_BASE}/w300`;

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const calcAge = (birthday: string | null, deathday: string | null): string => {
  if (!birthday) return '';
  const end = deathday ? new Date(deathday) : new Date();
  const born = new Date(birthday);
  const age = end.getFullYear() - born.getFullYear() -
    (end < new Date(end.getFullYear(), born.getMonth(), born.getDate()) ? 1 : 0);
  return deathday ? `${age} years old` : `${age} years old`;
};

const genderLabel = (g: number): string => {
  if (g === 1) return 'Female';
  if (g === 2) return 'Male';
  if (g === 3) return 'Non-binary';
  return '';
};

const sortCredits = (items: (CastCredit | CrewCredit)[]): (CastCredit | CrewCredit)[] =>
  [...items].sort((a, b) => {
    const dateA = (a.release_date ?? a.first_air_date ?? '').slice(0, 4);
    const dateB = (b.release_date ?? b.first_air_date ?? '').slice(0, 4);
    if (dateB !== dateA) return dateB.localeCompare(dateA);
    return b.popularity - a.popularity;
  });

const dedupe = (items: (CastCredit | CrewCredit)[]): (CastCredit | CrewCredit)[] => {
  const seen = new Set<string>();
  return items.filter(item => {
    const key = `${item.media_type}-${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

type FilmTab = 'acting' | 'crew';

export default function PersonScreen({ navigation, route }: any) {
  const { personId, personName } = route.params;

  const [details, setDetails] = useState<PersonDetails | null>(null);
  const [credits, setCredits] = useState<PersonCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [filmTab, setFilmTab] = useState<FilmTab>('acting');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [det, cred] = await Promise.all([
        tmdbService.getPersonDetails(personId),
        tmdbService.getPersonCredits(personId),
      ]);
      setDetails(det);
      setCredits(cred);
    } catch {
      setError('Could not load person data. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [personId]);

  useEffect(() => { loadData(); }, [loadData]);

  const actingCredits: (CastCredit | CrewCredit)[] = credits ? sortCredits(dedupe(credits.cast)) : [];
  const crewCredits: (CastCredit | CrewCredit)[] = credits ? sortCredits(dedupe(credits.crew)) : [];
  const filmList = filmTab === 'acting' ? actingCredits : crewCredits;

  if (loading) {
    return (
      <View style={styles.fullCenter}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (error || !details) {
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

  const photoUrl = details.profile_path ? `${PROFILE_URL}${details.profile_path}` : null;
  const bioText = details.biography || 'No biography available.';
  const bioIsLong = bioText.length > 280;
  const displayedBio = bioIsLong && !bioExpanded ? bioText.slice(0, 280) + '…' : bioText;
  const gender = genderLabel(details.gender);
  const age = calcAge(details.birthday, details.deathday);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.inner}>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backArrow}>←</Text>
            <Text style={styles.backLabel}>Back</Text>
          </TouchableOpacity>

          <View style={styles.hero}>
            {/* Photo */}
            <View style={styles.photoWrapper}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoEmoji}>🎭</Text>
                </View>
              )}
            </View>

            {/* Name + meta */}
            <View style={styles.heroInfo}>
              <Text style={styles.name}>{details.name}</Text>

              {/* Department badge */}
              <View style={styles.deptBadge}>
                <Text style={styles.deptText}>{details.known_for_department}</Text>
              </View>

              {/* Meta rows */}
              {gender ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Gender</Text>
                  <Text style={styles.metaValue}>{gender}</Text>
                </View>
              ) : null}

              {details.birthday && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Born</Text>
                  <Text style={styles.metaValue}>
                    {formatDate(details.birthday)}
                    {age ? `  ·  ${age}` : ''}
                  </Text>
                </View>
              )}

              {details.deathday && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Died</Text>
                  <Text style={styles.metaValue}>{formatDate(details.deathday)}</Text>
                </View>
              )}

              {details.place_of_birth && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>From</Text>
                  <Text style={styles.metaValue} numberOfLines={2}>{details.place_of_birth}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Біографія */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Biography</Text>
            <Text style={styles.bioText}>{displayedBio}</Text>
            {bioIsLong && (
              <TouchableOpacity onPress={() => setBioExpanded(p => !p)} activeOpacity={0.7}>
                <Text style={styles.bioToggle}>
                  {bioExpanded ? 'Show less ↑' : 'Read more ↓'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filmography</Text>

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, filmTab === 'acting' && styles.tabBtnActive]}
                onPress={() => setFilmTab('acting')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabBtnText, filmTab === 'acting' && styles.tabBtnTextActive]}>
                  🎭 Acting
                </Text>
                <Text style={[styles.tabCount, filmTab === 'acting' && styles.tabCountActive]}>
                  {actingCredits.length}
                </Text>
              </TouchableOpacity>

              {crewCredits.length > 0 && (
                <TouchableOpacity
                  style={[styles.tabBtn, filmTab === 'crew' && styles.tabBtnActive]}
                  onPress={() => setFilmTab('crew')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabBtnText, filmTab === 'crew' && styles.tabBtnTextActive]}>
                    🎬 Crew
                  </Text>
                  <Text style={[styles.tabCount, filmTab === 'crew' && styles.tabCountActive]}>
                    {crewCredits.length}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {filmList.length === 0 ? (
              <View style={styles.emptyFilm}>
                <Text style={styles.emptyFilmText}>No credits available</Text>
              </View>
            ) : (
              <FlatList
                data={filmList}
                keyExtractor={item => `${item.media_type}-${item.id}`}
                renderItem={({ item }) => (
                  <FilmographyCard
                    item={item}
                    onPress={item.media_type === 'movie' 
                      ? () => navigation.navigate('Movie', { movieId: item.id })
                      : item.media_type === 'tv'
                        ? () => navigation.navigate('Series', { seriesId: item.id })
                        : undefined
                    }
                  />
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filmList}
              />
            )}
          </View>

          {details.also_known_as.length > 0 && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Also known as</Text>
                <View style={styles.akaWrap}>
                  {details.also_known_as.slice(0, 6).map((name, i) => (
                    <View key={i} style={styles.akaChip}>
                      <Text style={styles.akaText}>{name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  fullCenter: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scrollContent: { alignItems: 'center' },
  inner: { width: '100%', maxWidth: MAX_WIDTH },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
  },
  backArrow: { fontFamily: FONTS.medium, fontSize: 20, color: COLORS.gold },
  backLabel: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.gold },

  hero: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  photoWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.gold,
    flexShrink: 0,
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: { fontSize: 40 },

  heroInfo: { flex: 1, paddingTop: 4 },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.white,
    marginBottom: 8,
    lineHeight: 26,
  },

  deptBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  deptText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.gold },

  metaRow: { flexDirection: 'row', gap: 6, marginBottom: 5, alignItems: 'flex-start' },
  metaLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.gray,
    width: 42,
    flexShrink: 0,
    marginTop: 1,
  },
  metaValue: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.white,
    flex: 1,
    lineHeight: 16,
  },

  divider: {
    height: 0.5,
    backgroundColor: COLORS.cardDark,
    marginHorizontal: 20,
    marginVertical: 16,
  },

  section: { paddingHorizontal: 20 },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 12,
  },

  bioText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#aaaaaa',
    lineHeight: 21,
  },
  bioToggle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.gold,
    marginTop: 8,
  },

  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 0.5,
    borderColor: COLORS.cardDark,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderColor: 'rgba(255,215,0,0.4)',
  },
  tabBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.gray,
  },
  tabBtnTextActive: { color: COLORS.gold },
  tabCount: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.cardTextLight,
  },
  tabCountActive: { color: COLORS.gold },

  filmList: {
    paddingLeft: 0,
    paddingRight: 20,
    paddingBottom: 4,
  },

  emptyFilm: { paddingVertical: 20, alignItems: 'center' },
  emptyFilmText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.cardTextLight },

  akaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  akaChip: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: COLORS.cardDark,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  akaText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.cardTextLight },

  errorEmoji: { fontSize: 40 },
  errorText:  { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  retryText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.gold },
});