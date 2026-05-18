import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const MAX_WIDTH = 480;
export const CONTENT_W = Math.min(SCREEN_WIDTH, MAX_WIDTH);
export const COLS = 3;
export const CARD_GAP = 10;
export const SIDE_PAD = 16;
export const CARD_W = (CONTENT_W - SIDE_PAD * 2 - CARD_GAP * (COLS - 1)) / COLS;
export const CARD_H = CARD_W * 1.5;
export const DRAWER_WIDTH = Math.min(CONTENT_W * 0.85, 340);

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center' },
  centered: { flex: 1, width: '100%', maxWidth: MAX_WIDTH, position: 'relative', overflow: 'hidden' },

  flatList: { flex: 1 },
  grid: { paddingHorizontal: SIDE_PAD, paddingBottom: 72 },
  row: { marginBottom: CARD_GAP },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray },

  footerWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 },

  aiCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 105, 180, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 105, 180, 0.35)',
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    gap: 12,
  },
  aiCtaIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 105, 180, 0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  aiCtaIconText: { fontSize: 20 },
  aiCtaTitle: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.white },
  aiCtaSubtitle: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray, marginTop: 2 },
  aiCtaArrow: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.pink },

  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  pageTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.white },
  pageSubtitle: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  refreshBtn: { backgroundColor: COLORS.cardBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 0.5, borderColor: '#2a2a2a' },
  refreshBtnText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.white },
  filterBtn: { backgroundColor: COLORS.cardBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 0.5, borderColor: COLORS.pink, flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterBtnText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.pink },
  filterBadge: { backgroundColor: COLORS.pink, borderRadius: 10, width: 16, height: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  filterBadgeText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.background },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 10 },
  drawer: { position: 'absolute', top: 0, right: 0, bottom: 0, width: DRAWER_WIDTH, backgroundColor: '#0d0d0d', borderLeftWidth: 0.5, borderLeftColor: '#222', zIndex: 20 },

  aiOverlayRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    zIndex: 30,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
    gap: 10,
  },
  aiCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center' },
  aiCloseText: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.white },
  aiHeaderTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.white },
  aiHeaderSubtitle: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.gray, marginTop: 2 },
  aiRefreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.cardBg, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: COLORS.pink },
  aiRefreshText: { fontSize: 14 },

  aiLoaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  aiLoaderText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.white, marginTop: 6 },
  aiLoaderSubtext: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray },

  aiErrorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  aiErrorEmoji: { fontSize: 48 },
  aiErrorTitle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.white },
  aiErrorText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.gray, textAlign: 'center' },
  aiRetryBtn: { marginTop: 16, paddingHorizontal: 28, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: COLORS.pink },
  aiRetryText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.pink },

  aiScrollContent: { padding: 16, paddingBottom: 80 },
  aiRecCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#222',
  },
  aiRecBody: { flex: 1, gap: 6 },
  aiCategoryBadgeWrap: { flexDirection: 'row' },
  aiCategoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 0.5 },
  aiBadgeStrong: { backgroundColor: 'rgba(255, 105, 180, 0.15)', borderColor: COLORS.pink },
  aiBadgeDiversity: { backgroundColor: 'rgba(135, 206, 250, 0.15)', borderColor: 'rgba(135, 206, 250, 0.5)' },
  aiBadgeGem: { backgroundColor: 'rgba(255, 215, 0, 0.15)', borderColor: 'rgba(255, 215, 0, 0.5)' },
  aiCategoryBadgeText: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.white },

  aiRecTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.white },
  aiRecYear: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.gray },
  aiRecReason: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray, lineHeight: 17 },

  aiFooter: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.gray, textAlign: 'center', marginTop: 12 },
});