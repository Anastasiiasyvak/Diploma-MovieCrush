import React from 'react';
import { View, Text, Image, FlatList, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { TMDB_IMAGE_BASE } from '../../constants/tmdb';
import { MovieImage } from '../../types/movie.types';

const ITEM_H = 110;
const ITEM_W = ITEM_H * 1.78;

interface Props { images: MovieImage[] }

export const MovieGallery: React.FC<Props> = ({ images }) => {
  if (images.length === 0) return null;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Photos</Text>
      <FlatList
        data={images.slice(0, 15)}
        keyExtractor={(_, i) => String(i)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.imgWrap}>
            <Image
              source={{ uri: `${TMDB_IMAGE_BASE}/w780${item.file_path}` }}
              style={styles.img}
              resizeMode="cover"
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.white, paddingHorizontal: 16 },
  list: { paddingHorizontal: 16, gap: 8 },
  imgWrap: {
    width: ITEM_W,
    height: ITEM_H,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.cardDark,
  },
  img: { width: '100%', height: '100%' },
});