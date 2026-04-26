import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { FONTS } from '../../../constants/fonts';

export const styles = StyleSheet.create({
  container: { 
    paddingHorizontal: 16, 
    marginBottom: 16 
  },

  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.white,
    marginBottom: 10,
  },

  loader: { 
    paddingVertical: 24, 
    alignItems: 'center' 
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '48.5%',
    gap: 4,
  },

  icon: { 
    fontSize: 22 
  },

  name: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.white,
  },

  count: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.cardTextLight,
  },
});