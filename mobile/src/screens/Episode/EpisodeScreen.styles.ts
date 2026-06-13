import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  fullCenter: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: 'center', justifyContent: 'center', gap: 12,
  },
  scroll: { paddingBottom: 24 },

  errorEmoji: { fontSize: 40 },
  errorText:  {
    fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray,
    textAlign: 'center', paddingHorizontal: 32,
  },
  retryBtn:  {
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.gold,
  },
  retryText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.gold },

  stillWrap: {
    width: '100%', aspectRatio: 16 / 9,
    position: 'relative', backgroundColor: COLORS.cardDark,
  },
  still: { width: '100%', height: '100%' },
  stillPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  overlayGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 48 : 28,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20, width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { fontFamily: FONTS.medium, fontSize: 18, color: COLORS.white },

  inner: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  episodeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  episodeChip: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(255,215,0,0.3)',
  },
  episodeChipText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.gold },
  metaText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.cardTextLight },

  title: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.white, lineHeight: 26 },

  tmdbRating: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.gold },

  watchBtn: {
    alignSelf: 'flex-start',
    borderRadius: 20, borderWidth: 1.5, borderColor: '#555',
    paddingVertical: 10, paddingHorizontal: 20,
  },
  watchBtnActive: { backgroundColor: '#00cc66', borderColor: '#00cc66' },
  watchBtnText: { fontFamily: FONTS.semiBold, fontSize: 13, color: '#aaa' },
  watchBtnTextActive: { color: COLORS.background },

  overviewWrap: { gap: 6 },
  overviewTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.white },
  overview: { fontFamily: FONTS.regular, fontSize: 13, color: '#aaa', lineHeight: 20 },

  divider: { height: 0.5, backgroundColor: COLORS.cardDark, marginVertical: 8 },

  rateSection: { alignItems: 'center', gap: 10 },
  rateSectionTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.white },

  resetWrap: { paddingTop: 16, alignItems: 'center' },
  resetBtn: {
    paddingHorizontal: 20, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,77,77,0.4)',
  },
  resetBtnText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.error },
});