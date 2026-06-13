import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

const { width: SCREEN_W } = Dimensions.get('window');

export const ACTOR_CARD_W = (SCREEN_W - 48 - 12) / 3;

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background, paddingTop: 52 },
  centered: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },

  // Progress
  progressWrap: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.darkGray },
  progressDotActive: { backgroundColor: COLORS.pink, width: 24 },

  // Headings
  heading: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.white, textAlign: 'center', paddingHorizontal: 24 },
  subheading: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.gray, textAlign: 'center', marginTop: 6, marginBottom: 20, paddingHorizontal: 24 },

  // Actors
  actorGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, justifyContent: 'center', paddingBottom: 100 },
  actorCard: { width: ACTOR_CARD_W, alignItems: 'center', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: COLORS.cardDark },
  actorCardSelected: { borderColor: COLORS.pink },
  actorPhoto: { width: ACTOR_CARD_W, height: ACTOR_CARD_W * 1.3 },
  actorCheckOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 28, backgroundColor: 'rgba(255,175,204,0.35)', alignItems: 'center', justifyContent: 'center' },
  actorCheck: { fontSize: 32, color: COLORS.white, fontFamily: FONTS.bold },
  actorName: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.white, textAlign: 'center', paddingVertical: 6, paddingHorizontal: 4 },

  // Bottom bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.cardDark },
  selectedCount: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.gray },
  nextBtn: { backgroundColor: COLORS.pink, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, minWidth: 110, alignItems: 'center' },
  nextBtnText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.background },
  saveErrorText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.error, flex: 1, marginRight: 12 },
  noneBtn: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  noneBtnText: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.gray },

  // Swipe
  swipeCounter: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.gray, textAlign: 'center', marginBottom: 16 },
  swipeCard: { alignSelf: 'center', width: SCREEN_W * 0.72, height: Dimensions.get('window').height * 0.5, borderRadius: 18, overflow: 'hidden', backgroundColor: COLORS.cardDark, elevation: 8, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  moviePoster: { width: '100%', height: '100%', position: 'absolute' },
  swipeOverlay: { position: 'absolute', top: 20, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 3 },
  overlayRight: { left: 16, borderColor: COLORS.success, transform: [{ rotate: '-15deg' }] },
  overlayLeft: { right: 16, borderColor: COLORS.error, transform: [{ rotate: '15deg' }] },
  overlayText: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.white },
  movieInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.72)' },
  movieTitle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.white },
  movieMeta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray, marginTop: 2 },
  swipeBtns: { flexDirection: 'row', justifyContent: 'center', gap: 36, marginTop: 28 },
  swipeBtn: { alignItems: 'center', width: 72, height: 72, borderRadius: 36, justifyContent: 'center', elevation: 4 },
  swipeBtnNo: { backgroundColor: '#2a1a1a', borderWidth: 2, borderColor: COLORS.error },
  swipeBtnYes: { backgroundColor: '#1a2a1a', borderWidth: 2, borderColor: COLORS.success },
  swipeBtnIcon: { fontSize: 22, color: COLORS.white, fontFamily: FONTS.bold },
  swipeBtnLabel: { fontSize: 9, color: COLORS.gray, fontFamily: FONTS.medium, marginTop: 2 },

  // Rating
  ratingList: { paddingHorizontal: 16, paddingBottom: 100, gap: 16 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardDark, borderRadius: 12, overflow: 'hidden' },
  ratingPoster: { width: 70, height: 100 },
  ratingInfo: { flex: 1, padding: 12 },
  ratingTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.white },
  ratingYear: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray, marginTop: 2, marginBottom: 8 },
  starRow: { flexDirection: 'row', gap: 2 },
  star: { fontSize: 16, color: COLORS.darkGray },
  starActive: { color: COLORS.gold },
  emptyRating: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.gray, textAlign: 'center', lineHeight: 22 },

  // Done
  doneEmoji: { fontSize: 72, marginBottom: 20 },
  doneTitle: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.white, marginBottom: 12 },
  doneSub: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.gray, textAlign: 'center', lineHeight: 22, paddingHorizontal: 40, marginBottom: 36 },
  doneBtn: { backgroundColor: COLORS.pink, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 28 },
  doneBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.background },
});