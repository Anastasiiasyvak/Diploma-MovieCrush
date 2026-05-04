import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },

  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.gray,
  },

  scrollContent: { alignItems: 'center', paddingBottom: 40 },
  inner: { width: '100%', maxWidth: 480 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 12,
  },
  headerSpacer: { width: 28 },

  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    gap: 14,
  },
  emptyEmoji:    { fontSize: 56 },
  emptyTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    color: COLORS.white,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.cardTextLight,
    textAlign: 'center',
    lineHeight: 21,
  },

  yearTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 28,
    color: COLORS.gold,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    letterSpacing: 1,
  },
  yearSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.cardTextLight,
    textAlign: 'center',
    marginBottom: 18,
  },

  slide: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    padding: 22,
    overflow: 'hidden',
  },

  slideTitle: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  bigNumber: {
    fontFamily: FONTS.semiBold,
    fontSize: 64,
    color: COLORS.white,
    lineHeight: 72,
  },
  bigNumberSuffix: {
    fontFamily: FONTS.medium,
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
  },
  bigSubtext: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 19,
    marginTop: 8,
  },

  countsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  countCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  countNum: {
    fontFamily: FONTS.semiBold,
    fontSize: 28,
    color: COLORS.white,
  },
  countLabel: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  topName: {
    fontFamily: FONTS.semiBold,
    fontSize: 36,
    color: COLORS.white,
    lineHeight: 42,
  },
  topSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    lineHeight: 19,
  },

  actorsList: { marginTop: 12, gap: 10 },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actorRank: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: 'rgba(255,255,255,0.55)',
    width: 22,
  },
  actorName: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.white,
    flex: 1,
  },
  actorVotes: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
  },

  topMovieRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  topMoviePoster: {
    width: 86, height: 128, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  topMovieInfo: { flex: 1, gap: 6 },
  topMovieTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.white,
    lineHeight: 22,
  },
  topMovieRating: {
    fontFamily: FONTS.medium,
    fontSize: 24,
    color: COLORS.gold,
  },
  topMovieRatingLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },

  topFanLine: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginTop: 10,
  },
  topFanHighlight: {
    fontFamily: FONTS.semiBold,
    color: COLORS.gold,
  },

  footerWrap: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  recomputeBtn: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#444',
    paddingVertical: 13,
    alignItems: 'center',
  },
  recomputeText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.white,
  },

  primaryBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.background,
  },
});