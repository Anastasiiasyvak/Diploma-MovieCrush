import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { Header } from '../../components/ui/Header';
import { Footer } from '../../components/ui/Footer';
import { Section } from '../../components/MediaRow';
import { tmdbService, Movie, TVSeries } from '../../services/tmdbService';

export default function HomeScreen({ navigation }: any) {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<TVSeries[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'recommendations' | 'challenges'>('home');

  useEffect(() => {
    const fetchAll = async () => {
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
      } catch (err) {
        setError('Could not load movies. Check your connection.');
        console.error('TMDB error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleTabPress = (tab: 'home' | 'recommendations' | 'challenges') => {
    setActiveTab(tab);
    if (tab === 'recommendations') {
      navigation.navigate('Recommendations');
    } else if (tab === 'challenges') {
      navigation.navigate('Challenges');
    }
  };

  const handleItemPress = (item: Movie | TVSeries) => {
    console.log('Item pressed:', 'title' in item ? item.title : item.name);
  };

  return (
    <View style={styles.container}>
      <View style={styles.centered}>

        <Header onProfilePress={() => navigation.navigate('Profile')} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.gold} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={styles.scrollContent}
          >
            <Section title="🎬 Trending Movies this week" data={trendingMovies} type="movie" onItemPress={handleItemPress} />
            <Section title="📺 Trending Series this week" data={trendingSeries} type="tv" onItemPress={handleItemPress} />
            <Section title="🍿 Upcoming" data={upcomingMovies} type="movie" onItemPress={handleItemPress} />
            <Section title="⭐ Top Rated all time" data={topRatedMovies} type="movie" onItemPress={handleItemPress} />
            <View style={{ height: 8 }} />
          </ScrollView>
        )}

        <Footer activeTab={activeTab} onTabPress={handleTabPress} />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.cardTextLight, textAlign: 'center' },

  scrollContent: { paddingBottom: 20 },
});