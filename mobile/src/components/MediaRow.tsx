import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { MovieCard } from './MovieCard';
import { Movie, TVSeries } from '../services/tmdbService';

interface SectionProps {
  title: string;
  data: (Movie | TVSeries)[];
  type: 'movie' | 'tv';
  onItemPress?: (item: Movie | TVSeries) => void;
}

export const Section: React.FC<SectionProps> = ({ title, data, type, onItemPress }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <FlatList
      data={data.slice(0, 10)}
      keyExtractor={item => item.id.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => {
        const isMovie = type === 'movie';
        const movie = item as Movie;
        const series = item as TVSeries;
        return (
          <MovieCard
            posterPath={item.poster_path}
            title={isMovie ? movie.title : series.name}
            year={isMovie
              ? movie.release_date?.slice(0, 4)
              : series.first_air_date?.slice(0, 4)
            }
            rating={item.vote_average}
            onPress={() => onItemPress?.(item)}
          />
        );
      }}
    />
  </View>
);

const styles = StyleSheet.create({
  section: { paddingTop: 20 },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.white,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: { paddingHorizontal: 20, gap: 12 },
});