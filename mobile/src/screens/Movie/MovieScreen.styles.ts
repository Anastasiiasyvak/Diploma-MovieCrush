import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  fullCenter: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scroll: { paddingBottom: 24 },

  errorEmoji: { fontSize: 40 },
  errorText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.gold },
  retryText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.gold },

  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.cardDark,
    alignItems: 'center', backgroundColor: COLORS.cardBg,
  },
  tabActive: { backgroundColor: 'rgba(255,215,0,0.12)', borderColor: 'rgba(255,215,0,0.5)' },
  tabText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.gray },
  tabTextActive: { color: COLORS.gold },

  divider: { height: 0.5, backgroundColor: COLORS.cardDark, marginHorizontal: 16, marginVertical: 20 },

  tabContent: { gap: 0 },
  gap: { height: 24 },

  rateSection: { paddingHorizontal: 16, alignItems: 'center', gap: 12 },
  rateSectionTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.white },

  resetWrap: { paddingHorizontal: 16, paddingTop: 24, alignItems: 'center' },
  resetBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.4)',
  },
  resetBtnText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.error },
});