import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../../constants/colors';
import { FONTS } from '../../../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = 480;
const CONTENT_W = Math.min(SCREEN_WIDTH, MAX_WIDTH);
const COLS = 3;
const CARD_GAP = 10;
const SIDE_PAD = 16;
const CARD_W = (CONTENT_W - SIDE_PAD * 2 - CARD_GAP * (COLS - 1)) / COLS;
const CARD_H = CARD_W * 1.5;

export const styles = StyleSheet.create({
  loader: { 
    paddingVertical: 32, 
    alignItems: 'center' 
  },
  empty: { 
    paddingVertical: 24, 
    alignItems: 'center' 
  },
  emptyText: { 
    fontFamily: FONTS.regular, 
    fontSize: 13, 
    color: '#2a2a2a' 
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIDE_PAD,
    paddingTop: 12,
    rowGap: CARD_GAP,
  },
  card: { 
    width: CARD_W 
  },
  posterWrap: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
    marginBottom: 6,
  },
  poster: { 
    width: '100%', 
    height: '100%' 
  },
  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardDark,
  },
  placeholderIcon: { 
    fontSize: 28 
  },

  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  ratingText: { 
    fontFamily: FONTS.medium, 
    fontSize: 9, 
    color: COLORS.gold 
  },

  typeBadge: {
    position: 'absolute',
    top: 6,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  typeBadgeTv: { 
    backgroundColor: 'rgba(255,175,204,0.25)' 
  },
  typeText: { 
    fontFamily: FONTS.medium, 
    fontSize: 8, 
    color: '#888888' 
  },

  title: { 
    fontFamily: FONTS.medium, 
    fontSize: 11, 
    color: COLORS.white, 
    lineHeight: 15 
  },
  year: { 
    fontFamily: FONTS.regular, 
    fontSize: 10, 
    color: COLORS.cardTextLight, 
    marginTop: 2 
  },
});

export const GRID_CONFIG = {
  CARD_GAP,
  SIDE_PAD,
  COLS,
};