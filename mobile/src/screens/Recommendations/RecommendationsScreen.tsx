import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Animated, StatusBar,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { Header } from '../../components/ui/Header';
import { Footer } from '../../components/ui/Footer';
import { MovieGridCard } from '../../components/recommendations/MovieGridCard';
import { DrawerContent } from '../../components/recommendations/DrawerContent';
import { fetchRecommendations, DiscoverFilters } from '../../services/tmdbService';
import {
  recommendationsService,
  isPersonalized,
  MainRecsResponse,
} from '../../services/recommendationsService';
import { getRelevantGenres, DECADES, DEFAULT_FILTERS } from '../../constants/genres';
import { MediaItem, ContentType, FilterState } from '../../types/tmdb.types';
import { styles, CARD_W, CARD_H, DRAWER_WIDTH, COLS } from './RecommendationsScreen.styles';

const isFiltersActive = (f: FilterState): boolean =>
  f.contentTypes.length > 0 ||
  f.genreIds.length > 0 ||
  f.decades.length > 0 ||
  f.countries.length > 0 ||
  f.ratingMin > 1 ||
  f.ratingMax < 10;

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
    minRating: f.ratingMin > 1 ? f.ratingMin : undefined,
    maxRating: f.ratingMax < 10 ? f.ratingMax : undefined,
  }));
};

const recsToMediaItems = (data: MainRecsResponse): MediaItem[] =>
  data.recommendations.map(r => ({
    id: r.tmdb_id,
    mediaType: r.media_type,
    title: r.title,
    poster_path: r.poster_path,
    vote_average: r.vote_average,
    release_date: r.release_date,
    overview: r.overview,
  } as MediaItem));

export default function RecommendationsScreen({ navigation }: any) {
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [pending, setPending] = useState<FilterState>(DEFAULT_FILTERS);
  const [seed, setSeed] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'recommendations' | 'challenges'>('recommendations');
  const [isPersonalizedMode, setIsPersonalizedMode] = useState(false);
  const [personalizedMeta, setPersonalizedMeta] = useState<{
    cached: boolean;
    computed_at: string;
    model_used: string;
  } | null>(null);

  const drawerAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const drawerScrollY = useRef(0);
  const initialLoadDone = useRef(false);

  const loadMovies = useCallback(async (f: FilterState, s: number, isRefresh = false) => {
    isRefresh ? setIsRefreshing(true) : setIsLoading(true);
    try {
      let items: MediaItem[] = [];

      if (isFiltersActive(f)) {
        setIsPersonalizedMode(false);
        setPersonalizedMeta(null);

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
        items = merged.slice(0, 25);
      } else {
        const data = await recommendationsService.getMain(s);

        if (isPersonalized(data)) {
          setIsPersonalizedMode(true);
          setPersonalizedMeta({
            cached: data.cached,
            computed_at: data.computed_at,
            model_used: data.model_used,
          });
        } else {
          setIsPersonalizedMode(false);
          setPersonalizedMeta(null);
        }

        items = recsToMediaItems(data);
      }

      setMovies(items);
    } catch (e) {
      console.error('Recommendations fetch error:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      loadMovies(filters, seed);
    }
  }, []));

  const openDrawer = () => {
    setPending(filters);
    drawerScrollY.current = 0;
    setDrawerOpen(true);
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(drawerAnim, { toValue: DRAWER_WIDTH, duration: 240, useNativeDriver: true }),
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

  const toggleGenre = useCallback((id: number) =>
    setPending(p => ({ ...p, genreIds: p.genreIds.includes(id) ? p.genreIds.filter(g => g !== id) : [...p.genreIds, id] })), []);

  const toggleDecade = useCallback((lbl: string) =>
    setPending(p => ({ ...p, decades: p.decades.includes(lbl) ? p.decades.filter(d => d !== lbl) : [...p.decades, lbl] })), []);

  const toggleCountry = useCallback((code: string) =>
    setPending(p => ({ ...p, countries: p.countries.includes(code) ? p.countries.filter(c => c !== code) : [...p.countries, code] })), []);

  const activeFilterCount = [
    filters.contentTypes.length > 0,
    filters.genreIds.length > 0,
    filters.decades.length > 0,
    filters.countries.length > 0,
    filters.ratingMin > 1 || filters.ratingMax < 10,
  ].filter(Boolean).length;

  const visibleGenres = getRelevantGenres(pending.contentTypes);

  const showNewBatch = isFiltersActive(filters) || !isPersonalizedMode;

  const personalizedDate = personalizedMeta?.computed_at
    ? new Date(personalizedMeta.computed_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null;

  const ListHeader = () => (
    <View>
      <View style={styles.listHeader}>
        <View>
          <Text style={styles.pageTitle}>
            {isPersonalizedMode ? 'For You ✨' : 'Discover 🎬'}
          </Text>
          {isPersonalizedMode && personalizedDate ? (
            <Text style={styles.pageSubtitle}>
              Updated {personalizedDate}
              {personalizedMeta?.model_used ? ` · ${personalizedMeta.model_used}` : ''}
            </Text>
          ) : (
            <Text style={styles.pageSubtitle}>{movies.length} picks this round</Text>
          )}
        </View>
        <View style={styles.headerActions}>
          {showNewBatch && (
            <TouchableOpacity style={styles.refreshBtn} onPress={refreshBatch} disabled={isRefreshing}>
              <Text style={styles.refreshBtnText}>{isRefreshing ? '...' : '🔄 New batch'}</Text>
            </TouchableOpacity>
          )}
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
            <Text style={styles.loaderText}>
              {isPersonalizedMode ? 'Personalizing your picks…' : 'Finding your picks…'}
            </Text>
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
                    navigation.navigate('Movie', { movieId: item.id });
                  } else {
                    navigation.navigate('Series', { seriesId: item.id });
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
              <Pressable style={styles.overlay} onPress={closeDrawer} />
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