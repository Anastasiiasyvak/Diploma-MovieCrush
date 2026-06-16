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
});