import { StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export const styles = StyleSheet.create({
  wrap: { gap: 10 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  title: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.white },
  totalWatched: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gold },
  list: { gap: 8, paddingHorizontal: 16 },

  seasonWrap: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#222',
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  seasonHeaderExpanded: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
  },
  seasonPosterWrap: {
    width: 52, height: 76, borderRadius: 6,
    overflow: 'hidden', flexShrink: 0,
    backgroundColor: COLORS.cardDark,
  },
  seasonPoster: { width: '100%', height: '100%' },
  seasonPosterPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  seasonInfo: { flex: 1 },
  seasonName: {
    fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.white, marginBottom: 3,
  },
  seasonMeta: {
    fontFamily: FONTS.regular, fontSize: 11, color: COLORS.cardTextLight, marginBottom: 2,
  },
  seasonProgress: {
    fontFamily: FONTS.medium, fontSize: 10, color: COLORS.gold,
  },
  seasonChevron: {
    fontFamily: FONTS.medium, fontSize: 11, color: COLORS.gold, paddingHorizontal: 4,
  },

  episodesList: { paddingBottom: 4 },
  episodesLoader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 16, justifyContent: 'center',
  },
  episodesLoadingText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray },
  seasonFullOverview: {
    fontFamily: FONTS.regular, fontSize: 12, color: '#888',
    paddingHorizontal: 12, paddingTop: 10, paddingBottom: 4, lineHeight: 18,
  },

  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#1a1a1a',
  },
  episodeRowWatched: { backgroundColor: 'rgba(0,204,102,0.04)' },
  episodeLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },

  stillWrap: {
    width: 80, height: 50, borderRadius: 6,
    overflow: 'hidden', flexShrink: 0,
    backgroundColor: COLORS.cardDark, position: 'relative',
  },
  still: { width: '100%', height: '100%' },
  stillPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  epNumBadge: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1,
  },
  epNumText: { fontFamily: FONTS.medium, fontSize: 9, color: COLORS.white },

  episodeInfo: { flex: 1 },
  episodeName: {
    fontFamily: FONTS.medium, fontSize: 12, color: COLORS.white,
    lineHeight: 17, marginBottom: 3,
  },
  episodeNameWatched: { color: '#888' },
  episodeMeta: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  episodeDateText: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.cardTextLight },
  episodeMisc:     { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.cardTextLight },
  episodeOverview: {
    fontFamily: FONTS.regular, fontSize: 11, color: '#888',
    marginTop: 5, lineHeight: 16,
  },
  detailsBtn: { marginTop: 6 },
  detailsBtnText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.gold },

  watchedBtn: {
    width: 32, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#444',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  watchedBtnActive: {
    backgroundColor: '#00cc66',
    borderColor: '#00cc66',
  },
  watchedBtnText: { fontFamily: FONTS.bold, fontSize: 12, color: '#555' },
  watchedBtnTextActive: { color: COLORS.background },
});