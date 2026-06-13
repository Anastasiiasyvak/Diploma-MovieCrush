import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', position: 'relative' },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.cardTextLight, textAlign: 'center' },
  scrollContent: { paddingBottom: 8 },

  searchContent: { flex: 1 },
  searchHint: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
    paddingBottom: 80,
  },
  hintTitle: { fontFamily: FONTS.semiBold, fontSize: 18, color: COLORS.white, textAlign: 'center' },
  hintText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray, textAlign: 'center', lineHeight: 21 },

  footerWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 5 },
});