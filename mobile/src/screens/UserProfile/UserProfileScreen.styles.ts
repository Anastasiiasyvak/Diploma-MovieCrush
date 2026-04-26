import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },

  errorEmoji: { fontSize: 40 },

  errorText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },

  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },

  retryText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.gold },

  scrollContent: { alignItems: 'center' },

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

  heroSection: { alignItems: 'center', paddingHorizontal: 20 },

  avatarWrapper: {
    borderWidth: 2.5,
    borderColor: COLORS.gold,
    overflow: 'hidden',
    marginBottom: 12,
  },

  avatarImage: { width: '100%', height: '100%', borderRadius: 999 },

  avatarPlaceholder: {
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  silhouetteHead: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#333',
    marginBottom: 2, marginTop: -8,
  },

  silhouetteBody: {
    width: 44, height: 24, borderRadius: 22,
    backgroundColor: '#333',
  },

  username: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.pink,
    marginBottom: 2,
  },

  fullName: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#666666',
    marginBottom: 4,
  },

  mutualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },

  mutualBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.gold,
  },

  socialsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  followBtnWrap: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 6,
  },

  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minWidth: 180,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1.5,
  },

  followBtnFollow: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },

  followBtnUnfollow: {
    backgroundColor: 'transparent',
    borderColor: COLORS.pink,
  },

  followBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },

  followBtnTextFollow: { color: COLORS.background },
  followBtnTextUnfollow: { color: COLORS.pink },

  followRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: COLORS.cardDark,
    marginTop: 16,
    marginBottom: 16,
  },

  followCell: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },

  followDivider: { width: 0.5, backgroundColor: COLORS.cardDark },

  followNum: { fontFamily: FONTS.semiBold, fontSize: 17, color: COLORS.gold },

  followLabel: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.cardTextLight,
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  tabsScroll: { marginBottom: 0 },
  tabsContainer: {
    paddingHorizontal: 20, gap: 4,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.cardDark,
  },
  tab: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.gold },
  tabLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.cardTextLight },
  tabLabelActive: { color: COLORS.gold },
});