import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Animated, StatusBar,
  Pressable, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { Header } from '../../components/ui/Header';
import { Footer } from '../../components/ui/Footer';
import { MovieGridCard } from '../../components/recommendations/MovieGridCard';
import { DrawerContent } from '../../components/recommendations/DrawerContent';
import { fetchRecommendations, DiscoverFilters } from '../../services/tmdbService';
import { recommendationsService, AiRecommendation } from '../../services/recommendationsService';
import { getRelevantGenres, DECADES, DEFAULT_FILTERS } from '../../constants/genres';
import { MediaItem, ContentType, FilterState } from '../../types/tmdb.types';
import { styles, CARD_W, CARD_H, DRAWER_WIDTH, COLS } from './RecommendationsScreen.styles';

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
    sortBy: 'popularity.desc',
  }));
};

const aiToMediaItem = (r: AiRecommendation): MediaItem => ({
  id: r.tmdb_id,
  mediaType: 'movie',
  title: r.title,
  poster_path: r.poster_path,
  vote_average: r.vote_average,
  release_date: `${r.year}-01-01`,
  overview: r.overview,
} as MediaItem);

export default function RecommendationsScreen({ navigation }: any) {
  // звичайні реки
  const [movies, setMovies] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [pending, setPending] = useState<FilterState>(DEFAULT_FILTERS);
  const [seed, setSeed] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'recommendations' | 'challenges'>('recommendations');

  //AI Assistant state 
  const [aiOpen, setAiOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [aiRecs, setAiRecs] = useState<AiRecommendation[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCached, setAiCached] = useState(false);
  const [aiModelUsed, setAiModelUsed] = useState<string>('');
  const [aiWatchedCount, setAiWatchedCount] = useState(0);

  const drawerAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
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

  const openAi = async () => {
    setAiOpen(true);
    if (aiRecs.length > 0) return;
    await loadAiRecs(false);
  };

  const closeAi = () => setAiOpen(false);

  const loadAiRecs = async (forceRefresh: boolean) => {
    forceRefresh ? setAiRefreshing(true) : setAiLoading(true);
    setAiError(null);
    try {
      const data = forceRefresh
        ? await recommendationsService.refreshAi()
        : await recommendationsService.getAi();
      setAiRecs(data.recommendations);
      setAiCached(data.cached);
      setAiModelUsed(data.model_used);
      setAiWatchedCount(data.watched_count);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Could not load AI recommendations.';
      setAiError(msg);
    } finally {
      setAiLoading(false);
      setAiRefreshing(false);
    }
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

  const ListHeader = () => (
    <View>
      <TouchableOpacity style={styles.aiCta} onPress={openAi} activeOpacity={0.85}>
        <View style={styles.aiCtaIcon}>
          <Text style={styles.aiCtaIconText}>✨</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.aiCtaTitle}>AI Assistant</Text>
          <Text style={styles.aiCtaSubtitle}>Personalized picks based on your watched list</Text>
        </View>
        <Text style={styles.aiCtaArrow}>›</Text>
      </TouchableOpacity>

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

        {aiOpen && (
          <View style={styles.aiOverlayRoot}>
            <View style={styles.aiHeader}>
              <TouchableOpacity onPress={closeAi} style={styles.aiCloseBtn}>
                <Text style={styles.aiCloseText}>✕</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiHeaderTitle}>AI Assistant ✨</Text>
                {!aiLoading && !aiError && aiRecs.length > 0 && (
                  <Text style={styles.aiHeaderSubtitle}>
                    {aiCached ? 'From cache · ' : 'Just generated · '}
                    {aiWatchedCount} movies analyzed
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.aiRefreshBtn}
                onPress={() => loadAiRecs(true)}
                disabled={aiRefreshing || aiLoading}
              >
                <Text style={styles.aiRefreshText}>
                  {aiRefreshing ? '...' : '🔄'}
                </Text>
              </TouchableOpacity>
            </View>

            {aiLoading ? (
              <View style={styles.aiLoaderWrap}>
                <ActivityIndicator size="large" color={COLORS.pink} />
                <Text style={styles.aiLoaderText}>Analyzing your taste…</Text>
                <Text style={styles.aiLoaderSubtext}>This can take 10-30 seconds</Text>
              </View>
            ) : aiError ? (
              <View style={styles.aiErrorWrap}>
                <Text style={styles.aiErrorEmoji}>🎬</Text>
                <Text style={styles.aiErrorTitle}>Can't generate yet</Text>
                <Text style={styles.aiErrorText}>{aiError}</Text>
                <TouchableOpacity style={styles.aiRetryBtn} onPress={() => loadAiRecs(false)}>
                  <Text style={styles.aiRetryText}>Try again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                contentContainerStyle={styles.aiScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {aiRecs.map((rec, idx) => (
                  <TouchableOpacity
                    key={`${rec.tmdb_id}-${idx}`}
                    style={styles.aiRecCard}
                    activeOpacity={0.85}
                    onPress={() => {
                      setAiOpen(false);
                      navigation.navigate('Movie', { movieId: rec.tmdb_id });
                    }}
                  >
                    <MovieGridCard
                      item={aiToMediaItem(rec)}
                      index={idx}
                      cardWidth={90}
                      cardHeight={135}
                      onPress={() => {
                        setAiOpen(false);
                        navigation.navigate('Movie', { movieId: rec.tmdb_id });
                      }}
                    />
                    <View style={styles.aiRecBody}>
                      <View style={styles.aiCategoryBadgeWrap}>
                        <View
                          style={[
                            styles.aiCategoryBadge,
                            rec.category === 'strong_match' && styles.aiBadgeStrong,
                            rec.category === 'diversity' && styles.aiBadgeDiversity,
                            rec.category === 'hidden_gem' && styles.aiBadgeGem,
                          ]}
                        >
                          <Text style={styles.aiCategoryBadgeText}>
                            {rec.category === 'strong_match' && '🎯 Strong match'}
                            {rec.category === 'diversity' && '🌀 Diversity'}
                            {rec.category === 'hidden_gem' && '💎 Hidden gem'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.aiRecTitle} numberOfLines={1}>
                        {rec.title} <Text style={styles.aiRecYear}>· {rec.year}</Text>
                      </Text>
                      <Text style={styles.aiRecReason} numberOfLines={3}>
                        {rec.reasoning}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {aiModelUsed && (
                  <Text style={styles.aiFooter}>Powered by {aiModelUsed}</Text>
                )}
              </ScrollView>
            )}
          </View>
        )}
      </View>
    </View>
  );
}