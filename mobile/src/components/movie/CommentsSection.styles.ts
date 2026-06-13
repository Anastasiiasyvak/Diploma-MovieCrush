import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export const styles = StyleSheet.create({
  wrap: { gap: 14 },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.white,
    paddingHorizontal: 16,
  },
  count: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 13 },

  inputWrap: {
    marginHorizontal: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#222',
    padding: 14,
    gap: 10,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.white,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.cardTextLight,
    textAlign: 'right',
  },
  toggleRow: { flexDirection: 'row', gap: 16 },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray },

  postBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.background,
  },

  editWrap: {
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: 14,
    gap: 10,
  },
  editTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.gold },
  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  cancelBtnText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.gray },

  loader: { alignItems: 'center', paddingVertical: 20 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.cardTextLight },

  list: { gap: 8 },

  card: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 0.5,
    borderColor: '#1a1a1a',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', flexShrink: 0 },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 16 },
  cardMeta: { flex: 1 },
  username: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.white },
  editedBadge: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.cardTextLight },
  time: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.cardTextLight },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spoilerBadge: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  spoilerBadgeText: { fontSize: 12 },
  actionBtn: { paddingHorizontal: 6, paddingVertical: 3 },
  actionBtnText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.gray },

  spoilerBlur: {
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,107,53,0.3)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  spoilerBlurText: { fontFamily: FONTS.medium, fontSize: 13, color: '#ff6b35' },
  commentText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#cccccc',
    lineHeight: 20,
  },

  reactRow: { flexDirection: 'row', gap: 10 },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.cardDark,
  },
  reactBtnActive: { backgroundColor: 'rgba(255,215,0,0.12)' },
  reactIcon: { fontSize: 13 },
  reactCount: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.gray },
  reactCountActive: { color: COLORS.gold },
});