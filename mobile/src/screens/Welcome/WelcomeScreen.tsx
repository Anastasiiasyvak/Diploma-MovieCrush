import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { GradientButton } from '../../components/ui/GradientButton';
import { OutlineButton } from '../../components/ui/OutlineButton';
import { styles } from './WelcomeScreen.styles';

export default function WelcomeScreen({ navigation }: any) {
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