import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 14,
    textAlign: 'center',
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
    paddingTop: 60,
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

  heroWrap: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },

  congratsLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.pink,
    letterSpacing: 1.2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },

  congratsTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 20,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 16,
  },

  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: COLORS.gold,
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouetteHead: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#333', marginBottom: 2, marginTop: -10,
  },
  silhouetteBody: {
    width: 56, height: 30, borderRadius: 28,
    backgroundColor: '#333',
  },

  matchUsername: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.pink,
  },
  matchFullName: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },

  scoreBadge: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 18,
    alignItems: 'center',
  },
  scoreNum: {
    fontFamily: FONTS.semiBold,
    fontSize: 32,
    color: COLORS.gold,
  },
  scoreLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.gold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: -2,
  },

  viewProfileBtn: {
    marginTop: 18,
    paddingVertical: 11,
    paddingHorizontal: 28,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.pink,
  },
  viewProfileText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.pink,
  },

  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.white,
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
  },

  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 12,
  },
  breakdownLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.white,
    width: 90,
  },
  breakdownBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.cardDark,
    borderRadius: 4,
    overflow: 'hidden',
  },
  breakdownBarFg: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  breakdownPct: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.cardTextLight,
    width: 36,
    textAlign: 'right',
  },

  sharedText: {
    color: COLORS.cardTextLight,
    fontSize: 13,
    lineHeight: 20,
    paddingHorizontal: 20,
  },

  actionsWrap: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 10,
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

  secondaryBtn: {
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#444',
    paddingVertical: 13,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.white,
  },

  consentNote: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.cardTextLight,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 24,
    lineHeight: 16,
  },
});