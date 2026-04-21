import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, StyleSheet, ActivityIndicator, Text, ScrollView,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { Header } from '../../components/ui/Header';
import { Footer } from '../../components/ui/Footer';
import { SearchBar, SearchTab } from '../../components/search/SearchBar';
import { SearchResultsView, MediaResult, CastResult } from '../../components/search/SearchResultsView';
import { Section } from '../../components/MediaRow';
import { tmdbService } from '../../services/tmdbService';
import { Movie, TVSeries } from '../../types/tmdb.types';

const searchMedia = async (query: string): Promise<MediaResult[]> => {
  const [moviesRes, seriesRes] = await Promise.all([
    tmdbService.searchMovies(query),
    tmdbService.searchSeries(query),
  ]);
  const movies: MediaResult[] = moviesRes.results.slice(0, 15).map(m => ({
    id: m.id, mediaType: 'movie',
    title: m.title, year: m.release_date?.slice(0, 4) ?? '—',
    posterPath: m.poster_path, rating: m.vote_average,
  }));
  const series: MediaResult[] = seriesRes.results.slice(0, 15).map(s => ({
    id: s.id, mediaType: 'tv',
    title: s.name, year: s.first_air_date?.slice(0, 4) ?? '—',
    posterPath: s.poster_path, rating: s.vote_average,
  }));
  return [...movies, ...series].sort((a, b) => b.rating - a.rating);
};

const searchCast = async (query: string): Promise<CastResult[]> => {
  const data = await tmdbService.searchPeople(query);
  return data.results.slice(0, 15).map(p => ({
    id: p.id,
    name: p.name,
    role: p.known_for_department ?? 'Acting',
    profilePath: p.profile_path,
    knownFor: p.known_for?.[0]?.title ?? p.known_for?.[0]?.name ?? '-',
  }));
};

export default function HomeScreen({ navigation }: any) {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<TVSeries[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [searchActive, setSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTab, setSearchTab] = useState<SearchTab>('all');
  const [searchLoading, setSearchLoading] = useState(false);
  const [mediaResults, setMediaResults] = useState<MediaResult[]>([]);
  const [castResults, setCastResults] = useState<CastResult[]>([]);
  const [hasResults, setHasResults] = useState(false);

  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeTab, setActiveTab] = useState<'home' | 'recommendations' | 'challenges'>('home');

  useEffect(() => {
    (async () => {
      try {
        const [moviesRes, seriesRes, topRes, upcomingRes] = await Promise.all([
          tmdbService.getTrendingMovies('week'),
          tmdbService.getTrendingSeries('week'),
          tmdbService.getTopRatedMovies(),
          tmdbService.getUpcomingMovies(),
        ]);
        setTrendingMovies(moviesRes.results);
        setTrendingSeries(seriesRes.results);
        setTopRatedMovies(topRes.results);
        setUpcomingMovies(upcomingRes.results);
      } catch {
        setFeedError('Could not load movies. Check your connection.');
      } finally {
        setFeedLoading(false);
      }
    })();
  }, []);

  const runSearch = useCallback(async (q: string, tab: SearchTab) => {
    if (!q.trim()) {
      setMediaResults([]);
      setCastResults([]);
      setHasResults(false);
      return;
    }
    setSearchLoading(true);
    setHasResults(true);
    try {
      if (tab === 'all') {
        const [media, cast] = await Promise.all([searchMedia(q), searchCast(q)]);
        setMediaResults(media);
        setCastResults(cast);
      } else if (tab === 'media') {
        const media = await searchMedia(q);
        setMediaResults(media);
        setCastResults([]);
      } else {
        const cast = await searchCast(q);
        setCastResults(cast);
        setMediaResults([]);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback((text: string) => {
    setSearchQuery(text);

    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (text.trim().length >= 2) {
      searchDebounce.current = setTimeout(() => {
        runSearch(text, searchTab);
      }, 500);
    } else {
      setMediaResults([]);
      setCastResults([]);
      setHasResults(false);
    }
  }, [searchTab, runSearch]);

  const handleTabChange = useCallback((tab: SearchTab) => {
    setSearchTab(tab);
    if (searchQuery.trim().length >= 2) {
      runSearch(searchQuery, tab);
    }
  }, [searchQuery, runSearch]);

  const handleCancel = () => {
    setSearchActive(false);
    setSearchQuery('');
    setHasResults(false);
    setMediaResults([]);
    setCastResults([]);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
  };

  const handleClear = () => {
    setSearchQuery('');
    setHasResults(false);
    setMediaResults([]);
    setCastResults([]);
  };

  const handleTabPress = (tab: 'home' | 'recommendations' | 'challenges') => {
    setActiveTab(tab);
    if (tab === 'recommendations') navigation.navigate('Recommendations');
    if (tab === 'challenges') navigation.navigate('Challenges');
  };

  return (
    <View style={styles.container}>
      <View style={styles.centered}>

        <Header onProfilePress={() => navigation.navigate('Profile')} />

        <SearchBar
          query={searchQuery}
          activeTab={searchTab}
          isActive={searchActive}
          onChangeText={handleQueryChange}
          onTabChange={handleTabChange}
          onActivate={() => setSearchActive(true)}
          onCancel={handleCancel}
          onClear={handleClear}
        />

        {searchActive ? (
          <View style={styles.searchContent}>
            {!hasResults ? (
              <View style={styles.searchHint}>
                <Text style={styles.hintTitle}>Search MovieCrush</Text>
                <Text style={styles.hintText}>
                  Find movies, series, anime,{'\n'}cartoons and cast & crew
                </Text>
              </View>
            ) : (
              <SearchResultsView
                tab={searchTab}
                isLoading={searchLoading}
                mediaResults={mediaResults}
                castResults={castResults}
                query={searchQuery}
                navigation={navigation}
              />
            )}
          </View>
        ) : (
          <>
            {feedLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.gold} />
              </View>
            ) : feedError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{feedError}</Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <Section title="🎬 Trending Movies this week" data={trendingMovies} type="movie" onItemPress={item => navigation.navigate('Movie', { movieId: item.id })} />
                <Section title="📺 Trending Series this week" data={trendingSeries} type="tv"    onItemPress={item => navigation.navigate('Series', { seriesId: item.id })} />
                <Section title="🍿 Upcoming" data={upcomingMovies} type="movie" onItemPress={item => navigation.navigate('Movie', { movieId: item.id })} />
                <Section title="⭐ Top Rated all time" data={topRatedMovies} type="movie" onItemPress={item => navigation.navigate('Movie', { movieId: item.id })} />
                <View style={{ height: 80 }} />
              </ScrollView>
            )}
          </>
        )}

        <View style={styles.footerWrapper}>
          <Footer activeTab={activeTab} onTabPress={handleTabPress} />
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', position: 'relative' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.cardTextLight, textAlign: 'center' },
  scrollContent: { paddingBottom: 8 },

  searchContent: { flex: 1 },
  searchHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
    paddingBottom: 80,
  },
  hintTitle: { fontFamily: FONTS.semiBold, fontSize: 18, color: COLORS.white, textAlign: 'center' },
  hintText: { fontFamily: FONTS.regular,  fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 21 },

  footerWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 },
});