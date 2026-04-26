import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },

  gradient: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    position: 'relative',
  },

  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },

  emoji: { fontSize: 36 },

  textBlock: { flex: 1, gap: 2 },

  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.background,
  },

  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: 'rgba(0,0,0,0.7)',
    lineHeight: 16,
  },

  chevron: {
    fontSize: 28,
    color: COLORS.background,
    fontFamily: FONTS.medium,
  },

  devBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  devBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 8,
    color: COLORS.gold,
    letterSpacing: 0.8,
  },
});