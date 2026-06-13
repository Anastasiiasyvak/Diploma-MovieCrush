import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH  = 480;
const CONTENT_W  = Math.min(SCREEN_WIDTH, MAX_WIDTH);
export const COLS     = 3;
export const CARD_GAP = 10;
const SIDE_PAD = 16;
const CARD_W   = (CONTENT_W - SIDE_PAD * 2 - CARD_GAP * (COLS - 1)) / COLS;
const CARD_H   = CARD_W * 1.5;

export const styles = StyleSheet.create({
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 60,
      gap: 8,
    },
  
    loadingText: {
      fontFamily: FONTS.regular,
      fontSize: 14,
      color: COLORS.gray,
      marginTop: 8,
    },
  
    emptyEmoji: { fontSize: 40, marginBottom: 8 },
  
    emptyTitle: {
      fontFamily: FONTS.semiBold,
      fontSize: 16,
      color: COLORS.white,
      textAlign: 'center',
    },
  
    emptySubtitle: {
      fontFamily: FONTS.regular,
      fontSize: 13,
      color: COLORS.gray,
      textAlign: 'center',
    },
  
    sectionTitle: {
      fontFamily: FONTS.semiBold,
      fontSize: 15,
      color: COLORS.white,
      paddingHorizontal: SIDE_PAD,
      paddingTop: 16,
      paddingBottom: 12,
    },
  
    sectionCount: {
      fontFamily: FONTS.regular,
      color: COLORS.gray,
      fontSize: 13,
    },
  
    nextSection: { marginTop: 8 },
  
    grid: { paddingHorizontal: SIDE_PAD },
    row: { marginBottom: CARD_GAP },
  
    mediaCard: { width: CARD_W },
  
    mediaPoster: {
      width: CARD_W,
      height: CARD_H,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: COLORS.cardBg,
      marginBottom: 6,
    },
  
    castPoster: { borderRadius: 10 },
  
    posterImg: { width: '100%', height: '100%' },
  
    posterPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.cardDark,
    },
  
    ratingBadge: {
      position: 'absolute',
      bottom: 6,
      left: 5,
      backgroundColor: 'rgba(0,0,0,0.78)',
      borderRadius: 6,
      paddingVertical: 2,
      paddingHorizontal: 5,
    },
  
    ratingText: {
      fontFamily: FONTS.medium,
      fontSize: 9,
      color: COLORS.gold,
    },
  
    typeBadge: {
      position: 'absolute',
      top: 6,
      right: 5,
      backgroundColor: 'rgba(0,0,0,0.65)',
      borderRadius: 5,
      paddingVertical: 2,
      paddingHorizontal: 5,
    },
  
    typeText: {
      fontFamily: FONTS.medium,
      fontSize: 8,
      color: COLORS.gray,
    },
  
    roleBadge: {
      position: 'absolute',
      bottom: 6,
      left: 5,
      backgroundColor: 'rgba(255,175,204,0.85)',
      borderRadius: 6,
      paddingVertical: 2,
      paddingHorizontal: 5,
    },
  
    roleText: {
      fontFamily: FONTS.medium,
      fontSize: 9,
      color: COLORS.background,
    },
  
    mediaTitle: {
      fontFamily: FONTS.medium,
      fontSize: 11,
      color: COLORS.white,
      lineHeight: 15,
    },
  
    mediaYear: {
      fontFamily: FONTS.regular,
      fontSize: 10,
      color: COLORS.cardTextLight,
      marginTop: 2,
    },
  
    usersList: {
      paddingHorizontal: SIDE_PAD,
    },
  
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: COLORS.cardBg,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: '#2a2a2a',
      marginBottom: 8,
      gap: 12,
    },
  
    userAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: COLORS.gold,
    },
  
    userAvatarImg: { width: '100%', height: '100%' },
  
    userAvatarPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.cardDark,
    },
  
    userAvatarEmoji: { fontSize: 22 },
  
    userInfo: { flex: 1, gap: 2 },
  
    userTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  
    userUsername: {
      fontFamily: FONTS.semiBold,
      fontSize: 14,
      color: COLORS.pink,
      flexShrink: 1,
    },
  
    followingBadge: {
      backgroundColor: 'rgba(255,215,0,0.15)',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 1,
    },
  
    followingBadgeText: {
      fontFamily: FONTS.medium,
      fontSize: 9,
      color: COLORS.gold,
    },
  
    userFullName: {
      fontFamily: FONTS.regular,
      fontSize: 12,
      color: COLORS.white,
    },
  
    userStats: {
      fontFamily: FONTS.regular,
      fontSize: 11,
      color: COLORS.cardTextLight,
    },
  
    userChevron: {
      fontSize: 24,
      color: COLORS.cardTextLight,
      paddingHorizontal: 4,
    },
});