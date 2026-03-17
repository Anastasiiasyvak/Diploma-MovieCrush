import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import { useFonts } from 'expo-font';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { Logo } from '../../components/ui/Logo';
import { GradientButton } from '../../components/ui/GradientButton';
import { OutlineButton } from '../../components/ui/OutlineButton';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: any) {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('../../../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../../../assets/fonts/Poppins-Bold.ttf'),
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleSlideAnim = useRef(new Animated.Value(-50)).current;
  const titleFadeAnim = useRef(new Animated.Value(0)).current;
  const subtitleSlideAnim = useRef(new Animated.Value(50)).current;
  const subtitleFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonsSlideAnim = useRef(new Animated.Value(30)).current;
  const buttonsFadeAnim = useRef(new Animated.Value(0)).current;
  const featuresSlideAnim = useRef(new Animated.Value(30)).current;
  const featuresFadeAnim = useRef(new Animated.Value(0)).current;
  const underlineWidthAnim = useRef(new Animated.Value(0)).current;

  const featureScales = [
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
    useRef(new Animated.Value(1)).current,
  ];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 1000, delay: 200, useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(titleSlideAnim, { toValue: 0, duration: 800, delay: 400, useNativeDriver: true }),
      Animated.timing(titleFadeAnim, { toValue: 1, duration: 800, delay: 400, useNativeDriver: true }),
    ]).start();

    Animated.timing(underlineWidthAnim, {
      toValue: 1, duration: 600, delay: 800, useNativeDriver: false,
    }).start();

    Animated.parallel([
      Animated.timing(subtitleSlideAnim, { toValue: 0, duration: 800, delay: 600, useNativeDriver: true }),
      Animated.timing(subtitleFadeAnim, { toValue: 1, duration: 800, delay: 600, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(buttonsSlideAnim, { toValue: 0, duration: 800, delay: 800, useNativeDriver: true }),
      Animated.timing(buttonsFadeAnim, { toValue: 1, duration: 800, delay: 800, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(featuresSlideAnim, { toValue: 0, duration: 800, delay: 1000, useNativeDriver: true }),
      Animated.timing(featuresFadeAnim, { toValue: 1, duration: 800, delay: 1000, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleFeaturePressIn = (index: number) => {
    Animated.spring(featureScales[index], { toValue: 1.1, useNativeDriver: true }).start();
  };

  const handleFeaturePressOut = (index: number) => {
    Animated.spring(featureScales[index], { toValue: 1, useNativeDriver: true }).start();
  };

  const brandUnderlineWidth = underlineWidthAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const features = [
    { icon: '🎬', label: 'Discover Movies' },
    { icon: '⭐', label: 'Rate & Review' },
    { icon: '💝', label: 'Get Recommendations' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.orb1} />
      <View style={styles.orb2} />

      {/* Logo */}
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Logo />
      </Animated.View>

      {/* Main Content */}
      <View style={styles.mainContent}>

        {/* Title */}
        <Animated.View
          style={[
            styles.welcomeSection,
            { opacity: titleFadeAnim, transform: [{ translateX: titleSlideAnim }] },
          ]}
        >
          <Text style={styles.welcomeTitle}>
            Welcome to{'\n'}
            <View style={styles.brandWrapper}>
              <Text style={styles.brandName}>MovieCrush!</Text>
              <Animated.View style={[styles.brandUnderline, { width: brandUnderlineWidth }]} />
            </View>
          </Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.welcomeSubtitle,
            { opacity: subtitleFadeAnim, transform: [{ translateX: subtitleSlideAnim }] },
          ]}
        >
          Discover your next favorite movie and share your passion with the world
        </Animated.Text>

        {/* Buttons */}
        <Animated.View
          style={[
            styles.buttonContainer,
            { opacity: buttonsFadeAnim, transform: [{ translateY: buttonsSlideAnim }] },
          ]}
        >
          <GradientButton
            label="Get Started"
            onPress={() => navigation.navigate('Register')}
          />
          <OutlineButton
            label="Sign In"
            onPress={() => navigation.navigate('Login')}
          />
        </Animated.View>

        {/* Features */}
        <Animated.View
          style={[
            styles.featuresPreview,
            { opacity: featuresFadeAnim, transform: [{ translateY: featuresSlideAnim }] },
          ]}
        >
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={1}
              onPressIn={() => handleFeaturePressIn(index)}
              onPressOut={() => handleFeaturePressOut(index)}
            >
              <Animated.View
                style={[styles.featureItem, { transform: [{ scale: featureScales[index] }] }]}
              >
                <Text style={styles.featureIcon}>{feature.icon}</Text>
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </Animated.View>
            </TouchableOpacity>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    alignSelf: 'center',
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