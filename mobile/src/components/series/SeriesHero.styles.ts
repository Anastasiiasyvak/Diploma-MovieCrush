import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 480;
const CONTENT_W = Math.min(SCREEN_WIDTH, MAX_WIDTH);
const BACKDROP_H = CONTENT_W * 0.56;
const POSTER_W = 100;
const POSTER_H = POSTER_W * 1.5;

export const styles = StyleSheet.create({
    backdropWrap: {
      width: '100%',
      height: BACKDROP_H,
      position: 'relative',
    },
    backdrop: {
      width: '100%',
      height: '100%',
      backgroundColor: COLORS.cardDark,
    },
    backdropPlaceholder: { backgroundColor: '#111' },
    backdropOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.2)',
    },
  
    backBtn: {
      position: 'absolute',
      top: 44,
      left: 16,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderRadius: 20,
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backArrow: { fontFamily: FONTS.medium, fontSize: 18, color: COLORS.white },
  
    statusBadge: {
      position: 'absolute',
      top: 44,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 20,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontFamily: FONTS.medium, fontSize: 10 },
  
    infoRow: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
      gap: 14,
      alignItems: 'flex-start',
    },
  
    posterWrap: {
      width: POSTER_W,
      height: POSTER_H,
      borderRadius: 10,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: COLORS.gold,
      flexShrink: 0,
      marginTop: -POSTER_H * 0.35,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 8,
    },
    poster: { width: '100%', height: '100%' },
    posterPlaceholder: {
      flex: 1,
      backgroundColor: COLORS.cardDark,
      alignItems: 'center',
      justifyContent: 'center',
    },
  
    titleBlock: { flex: 1, paddingTop: 4 },
    title: {
      fontFamily: FONTS.bold,
      fontSize: 18,
      color: COLORS.white,
      lineHeight: 24,
      marginBottom: 4,
    },
    tagline: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: COLORS.gray,
      fontStyle: 'italic',
      marginBottom: 4,
      lineHeight: 16,
    },
    year: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: COLORS.cardTextLight,
      marginBottom: 8,
    },
    starRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    starIcon: { fontSize: 14, color: COLORS.gold },
    ratingNum: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.gold, marginLeft: 2 },
    voteCount: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.cardTextLight, marginBottom: 8 },
  
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    chip: {
      backgroundColor: 'rgba(255,215,0,0.1)',
      borderRadius: 8,
      borderWidth: 0.5,
      borderColor: 'rgba(255,215,0,0.3)',
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    chipText: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.gold },
});