import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Linking } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { MovieVideo } from '../../types/movie.types';

interface Props { videos: MovieVideo[] }

const PlayIcon: React.FC = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"
      fill="#FF0000"
    />
    <Polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white" />
  </Svg>
);

export const TrailerButton: React.FC<Props> = ({ videos }) => {
  const trailer =
    videos.find(v => v.type === 'Trailer' && v.official && v.site === 'YouTube') ??
    videos.find(v => v.type === 'Trailer' && v.site === 'YouTube') ??
    videos.find(v => v.site === 'YouTube');

  if (!trailer) return null;

  const openTrailer = () => {
    const url = `https://www.youtube.com/watch?v=${trailer.key}`;
    Linking.openURL(url).catch(err => console.error('Cannot open YouTube:', err));
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.btn} onPress={openTrailer} activeOpacity={0.8}>
        <PlayIcon />
        <Text style={styles.btnText}>Watch Trailer on YouTube</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  btnText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.white },
});