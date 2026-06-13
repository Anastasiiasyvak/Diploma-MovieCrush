import { StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

const { width, height } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orb1: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255, 215, 0, 0.07)',
    left: -width * 0.2,
    top: height * 0.1,
  },
  orb2: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(255, 215, 0, 0.04)',
    right: -width * 0.1,
    top: height * 0.05,
  },
  mainContent: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontFamily: FONTS.bold,
    fontSize: width < 380 ? 30 : 36,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: width < 380 ? 38 : 46,
    letterSpacing: 0.3,
  },
  brandWrapper: {
    alignItems: 'center',
  },
  brandName: {
    fontFamily: FONTS.bold,
    fontSize: width < 380 ? 30 : 36,
    color: COLORS.gold,
  },
  brandUnderline: {
    height: 3,
    backgroundColor: COLORS.gold,
    borderRadius: 2,
    marginTop: 2,
  },
  welcomeSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 320,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
    marginBottom: 48,
  },
  featuresPreview: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: width < 380 ? 20 : 28,
    flexWrap: 'wrap',
  },
  featureItem: {
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    fontSize: width < 380 ? 26 : 32,
    marginBottom: 4,
  },
  featureLabel: {
    fontFamily: FONTS.medium,
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 80,
  },
});