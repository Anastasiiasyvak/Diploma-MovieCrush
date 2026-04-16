import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Animated, Dimensions, StatusBar,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { Header } from '../../components/ui/Header';
import { Footer } from '../../components/ui/Footer';
import { MovieGridCard } from '../../components/recommendations/MovieGridCard';
import { DrawerContent } from '../../components/recommendations/DrawerContent';
import { fetchRecommendations, DiscoverFilters } from '../../services/tmdbService';
import { getRelevantGenres, DECADES, DEFAULT_FILTERS } from '../../constants/genres';
import { MediaItem, ContentType, FilterState } from '../../types/tmdb.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 480;
const CONTENT_W = Math.min(SCREEN_WIDTH, MAX_WIDTH);
const COLS = 3;
const CARD_GAP = 10;
const SIDE_PAD = 16;
const CARD_W = (CONTENT_W - SIDE_PAD * 2 - CARD_GAP * (COLS - 1)) / COLS;
const CARD_H = CARD_W * 1.5;
const DRAWER_WIDTH = Math.min(CONTENT_W * 0.85, 340);

const buildFiltersList = (f: FilterState): DiscoverFilters[] => {
  const types = f.contentTypes.length ? f.contentTypes : ['movie' as ContentType];

  let yearFrom: number | undefined;
  let yearTo: number | undefined;
  if (f.decades.length) {
    const data = DECADES.filter(d => f.decades.includes(d.label));
    yearFrom = Math.min(...data.map(d => Number(d.from)));
    yearTo = Math.max(...data.map(d => Number(d.to)));
  }

  return types.map(ct => ({
    mediaType: ct,
    genreIds: f.genreIds.length ? f.genreIds : undefined,
    yearFrom,
    yearTo,
    originCountry: f.countries.length === 1 ? f.countries[0] : undefined,
    minRating: f.ratingMin > 1  ? f.ratingMin : undefined,
    maxRating: f.ratingMax < 10 ? f.ratingMax : undefined,
    sortBy: 'popularity.desc',
  }));
};

export default function RecommendationsScreen({ navigation }: any) {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [pending, setPending] = useState<FilterState>(DEFAULT_FILTERS);
  const [seed, setSeed] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'recommendations' | 'challenges'>('recommendations');

  const drawerAnim  = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const drawerScrollY = useRef(0); 

  const loadMovies = useCallback(async (f: FilterState, s: number, isRefresh = false) => {
    isRefresh ? setIsRefreshing(true) : setIsLoading(true);
    try {
      const filtersList = buildFiltersList(f);
      const results = await Promise.all(filtersList.map(fl => fetchRecommendations(fl, s)));

      const seen = new Set<string>();
      const merged: MediaItem[] = [];
      const maxLen = Math.max(...results.map(r => r.length));
      for (let i = 0; i < maxLen; i++) {
        for (const arr of results) {
          if (arr[i]) {
            const key = `${arr[i].mediaType}-${arr[i].id}`;
            if (!seen.has(key)) { seen.add(key); merged.push(arr[i]); }
          }
        }
      }
      setMovies(merged.slice(0, 25));
    } catch (e) {
      console.error('Recommendations fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadMovies(filters, seed); }, []));

  const openDrawer = () => {
    setPending(filters);
    drawerScrollY.current = 0;
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerAnim,  { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnim,  { toValue: DRAWER_WIDTH, duration: 240, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const applyFilters = () => {
    setSeed(0); setFilters(pending); closeDrawer(); loadMovies(pending, 0);
  };

  const resetFilters = () => setPending(DEFAULT_FILTERS);

  const refreshBatch = () => {
    const s = seed + 1; setSeed(s); loadMovies(filters, s, true);
  };

  const handleTabPress = (tab: 'home' | 'recommendations' | 'challenges') => {
    setActiveTab(tab);
    if (tab === 'home') navigation.navigate('Home');
    if (tab === 'challenges') navigation.navigate('Challenges');
  };

  const toggleContentType = useCallback((key: ContentType) =>
    setPending(p => ({
      ...p, genreIds: [],
      contentTypes: p.contentTypes.includes(key)
        ? p.contentTypes.filter(k => k !== key)
        : [...p.contentTypes, key],
    })), []);

  const toggleGenre   = useCallback((id: number)   =>
    setPending(p => ({ ...p, genreIds:  p.genreIds.includes(id)    ? p.genreIds.filter(g => g !== id)   : [...p.genreIds, id] })), []);

  const toggleDecade  = useCallback((lbl: string)  =>
    setPending(p => ({ ...p, decades:   p.decades.includes(lbl)    ? p.decades.filter(d => d !== lbl)   : [...p.decades, lbl] })), []);

  const toggleCountry = useCallback((code: string) =>
    setPending(p => ({ ...p, countries: p.countries.includes(code) ? p.countries.filter(c => c !== code) : [...p.countries, code] })), []);

  // Active filter badge count 
  const activeFilterCount = [
    filters.contentTypes.length > 0,
    filters.genreIds.length > 0,
    filters.decades.length > 0,
    filters.countries.length > 0,
    filters.ratingMin > 1 || filters.ratingMax < 10,
  ].filter(Boolean).length;

  const visibleGenres = getRelevantGenres(pending.contentTypes);

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <View>
        <Text style={styles.pageTitle}>For You ✨</Text>
        <Text style={styles.pageSubtitle}>{movies.length} picks this round</Text>
      </View>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.refreshBtn} onPress={refreshBatch} disabled={isRefreshing}>
          <Text style={styles.refreshBtnText}>{isRefreshing ? '...' : '🔄 New batch'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={openDrawer}>
          <Text style={styles.filterBtnText}>⚙️ Filter</Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.centered}>
        <Header onProfilePress={() => navigation.navigate('Profile')} />

        {isLoading ? (
          <View style={styles.loaderWrap}>
            <ActivityIndicator size="large" color={COLORS.pink} />
            <Text style={styles.loaderText}>Finding your picks…</Text>
          </View>
        ) : (
          <FlatList
            data={movies}
            keyExtractor={item => `${item.mediaType}-${item.id}`}
            numColumns={COLS}
            renderItem={({ item, index }) => (
              <MovieGridCard
                item={item}
                index={index}
                cardWidth={CARD_W}
                cardHeight={CARD_H}
                onPress={() => {
                  if (item.mediaType === 'movie') {
                    navigation.navigate('Movie', {movieId: item.id});
                  } else {
                    navigation.navigate('Series', {seriesId: item.id});
                  }
                }}
              />
            )}
            ListHeaderComponent={ListHeader}
            contentContainerStyle={styles.grid}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.row}
            style={styles.flatList}
          />
        )}

        <View style={styles.footerWrapper}>
          <Footer activeTab={activeTab} onTabPress={handleTabPress} />
        </View>

        {drawerOpen && (
          <>
            <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
            </Animated.View>
            <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerAnim }] }]}>
              <DrawerContent
                pending={pending}
                visibleGenres={visibleGenres}
                toggleContentType={toggleContentType}
                toggleGenre={toggleGenre}
                toggleDecade={toggleDecade}
                toggleCountry={toggleCountry}
                setPending={setPending}
                applyFilters={applyFilters}
                resetFilters={resetFilters}
                closeDrawer={closeDrawer}
                scrollY={drawerScrollY}
              />
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: COLORS.background, alignItems: 'center' },
  centered: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, position: 'relative', overflow: 'hidden' },

  flatList:   { flex: 1 },
  grid:       { paddingHorizontal: SIDE_PAD, paddingBottom: 72 },
  row:        { marginBottom: CARD_GAP },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray },

  footerWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 },

  listHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  pageTitle:     { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.white },
  pageSubtitle:  { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  refreshBtn:      { backgroundColor: COLORS.cardBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 0.5, borderColor: '#2a2a2a' },
  refreshBtnText:  { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.white },
  filterBtn:       { backgroundColor: COLORS.cardBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 0.5, borderColor: COLORS.pink, flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterBtnText:   { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.pink },
  filterBadge:     { backgroundColor: COLORS.pink, borderRadius: 10, width: 16, height: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  filterBadgeText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.background },

  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10 },
  drawer:  { position: 'absolute', top: 0, right: 0, bottom: 0, width: DRAWER_WIDTH, backgroundColor: '#0d0d0d', borderLeftWidth: 0.5, borderLeftColor: '#222', zIndex: 20 },
});