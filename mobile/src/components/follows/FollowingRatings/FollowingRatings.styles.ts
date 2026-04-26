import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { FONTS } from '../../../constants/fonts';

export const AVATAR_SIZE = 72;

export const styles = StyleSheet.create({
  wrap: {
    paddingTop: 8,
  },

  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.white,
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  count: {
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    fontSize: 13,
  },

  list: {
    paddingHorizontal: 16,
    gap: 14,
  },

  card: {
    width: AVATAR_SIZE,
    alignItems: 'center',
    gap: 4,
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },

  avatarImg: { width: '100%', height: '100%' },

  avatarPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },

  silhouetteHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#333',
    marginBottom: 2,
    marginTop: -6,
  },

  silhouetteBody: {
    width: 36,
    height: 20,
    borderRadius: 18,
    backgroundColor: '#333',
  },

  username: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.pink,
    marginTop: 6,
    maxWidth: AVATAR_SIZE,
  },

  ratingPill: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },

  ratingText: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    color: COLORS.gold,
  },
});