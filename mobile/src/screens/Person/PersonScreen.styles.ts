import { StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

const MAX_WIDTH = 480;
const PHOTO_SIZE = 110;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  fullCenter: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  scrollContent: { alignItems: 'center' },
  inner: { width: '100%', maxWidth: MAX_WIDTH },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 16,
  },
  backArrow: { fontFamily: FONTS.medium, fontSize: 20, color: COLORS.gold },
  backLabel: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.gold },

  hero: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 16,
  },

  photoWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.gold,
    flexShrink: 0,
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: { fontSize: 40 },

  heroInfo: { flex: 1, paddingTop: 4 },
  name: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.white,
    marginBottom: 8,
    lineHeight: 26,
  },

  deptBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,215,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 10,
  },
  deptText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.gold },

  metaRow: { flexDirection: 'row', gap: 6, marginBottom: 5, alignItems: 'flex-start' },
  metaLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.gray,
    width: 42,
    flexShrink: 0,
    marginTop: 1,
  },
  metaValue: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.white,
    flex: 1,
    lineHeight: 16,
  },

  divider: {
    height: 0.5,
    backgroundColor: COLORS.cardDark,
    marginHorizontal: 20,
    marginVertical: 16,
  },

  section: { paddingHorizontal: 20 },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.white,
    marginBottom: 12,
  },

  bioText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#aaaaaa',
    lineHeight: 21,
  },
  bioToggle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.gold,
    marginTop: 8,
  },

  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 0.5,
    borderColor: COLORS.cardDark,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderColor: 'rgba(255,215,0,0.4)',
  },
  tabBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.gray,
  },
  tabBtnTextActive: { color: COLORS.gold },
  tabCount: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.cardTextLight,
  },
  tabCountActive: { color: COLORS.gold },

  filmList: {
    paddingLeft: 0,
    paddingRight: 20,
    paddingBottom: 4,
  },

  emptyFilm: { paddingVertical: 20, alignItems: 'center' },
  emptyFilmText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.cardTextLight },

  akaWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  akaChip: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: COLORS.cardDark,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  akaText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.cardTextLight },

  errorEmoji: { fontSize: 40 },
  errorText:  { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray, textAlign: 'center', paddingHorizontal: 32 },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  retryText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.gold },
});