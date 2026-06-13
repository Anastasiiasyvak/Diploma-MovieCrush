import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },

  iconBtn: { alignItems: 'center', gap: 4, minWidth: 52 },
  iconLabel: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
  },
  iconLabelPink: { color: COLORS.pink },
  iconLabelGold: { color: COLORS.gold },

  watchBtn: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#555',
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  watchBtnActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  watchBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#aaa',
  },
  watchBtnTextActive: { color: COLORS.background },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#222',
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.cardDark,
  },
  modalTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.white },
  modalClose: { fontSize: 18, color: COLORS.cardTextLight, paddingHorizontal: 4 },
  modalLoader: { paddingVertical: 32, alignItems: 'center' },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  listItemAdded: { backgroundColor: 'rgba(255,215,0,0.05)' },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listItemName: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.white },
  listItemNameAdded: { color: COLORS.gold },
  privateBadge: { fontSize: 12 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  badgeAdded: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderColor: COLORS.gold,
  },
  badgeText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.gray,
  },
  badgeTextAdded: { color: COLORS.gold },
});