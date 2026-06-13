import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

const MAX_WIDTH = 480;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  centered: { flex: 1, maxWidth: MAX_WIDTH, width: '100%', alignSelf: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 8,
  },

  pageTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.white, paddingHorizontal: 20, marginBottom: 24 },

  removeBtn: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(255,77,77,0.3)' },
  removeBtnText: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.error },

  badge: { backgroundColor: COLORS.cardDark, borderRadius: 6, borderWidth: 0.5, borderColor: '#333', paddingVertical: 2, paddingHorizontal: 8 },
  badgeText: { fontFamily: FONTS.medium, fontSize: 11, color: '#666' },

  langRow: { flexDirection: 'row', gap: 8, padding: 12 },
  langBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 0.5, borderColor: '#333', alignItems: 'center' },
  langBtnActive: { borderColor: COLORS.gold, backgroundColor: 'rgba(255,215,0,0.06)' },
  langBtnText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.cardTextLight },
  langBtnTextActive: { color: COLORS.gold },

  importCard: { backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.cardDark, padding: 14 },
  importDesc: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.darkGray, lineHeight: 18, marginBottom: 12 },
  importBtn: { borderWidth: 0.5, borderColor: '#333', borderStyle: 'dashed', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  importBtnText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.cardTextLight },
  importBtnSub: { fontFamily: FONTS.regular, fontSize: 11, color: '#333' },

  logoutBtn: { marginHorizontal: 20, paddingVertical: 14, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,77,77,0.35)', backgroundColor: 'rgba(255,77,77,0.06)', alignItems: 'center', marginBottom: 12 },
  logoutBtnText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.error },
  deleteAccountBtn: { alignItems: 'center', paddingVertical: 8 },
  deleteAccountText: { fontFamily: FONTS.regular, fontSize: 12, color: '#2a2a2a' },
});