import { StyleSheet } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { FONTS } from '../../../constants/fonts';

export const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#222',
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.cardDark,
  },

  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.white,
  },

  closeBtn: {
    fontSize: 18,
    color: COLORS.cardTextLight,
    paddingHorizontal: 4,
  },

  loader: {
    paddingVertical: 40,
    alignItems: 'center',
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },

  emptyIcon: { fontSize: 36, marginBottom: 12 },

  emptyText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.cardTextLight,
    textAlign: 'center',
  },

  list: {
    padding: 12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.cardDark,
  },

  rowLast: { borderBottomWidth: 0 },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },

  avatarImg: { width: '100%', height: '100%' },

  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardDark,
  },

  avatarEmoji: { fontSize: 20 },

  info: { flex: 1, gap: 2 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  username: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.pink,
    flexShrink: 1,
  },

  badge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },

  badgeText: {
    fontFamily: FONTS.medium,
    fontSize: 8,
    color: COLORS.gold,
  },

  fullName: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.white,
  },

  chevron: {
    fontSize: 20,
    color: COLORS.cardTextLight,
    paddingHorizontal: 4,
  },
});