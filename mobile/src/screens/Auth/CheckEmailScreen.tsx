import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { Logo } from '../../components/ui/Logo';
import { OutlineButton } from '../../components/ui/OutlineButton';
import { saveTokens } from '../../services/storage';
import api from '../../services/api';

export default function CheckEmailScreen({ route, navigation }: any) {
  const email = route.params?.email || '';
  const [isPolling, setIsPolling] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const response = await api.post('/auth/check-verified', { email });

        if (response.data.verified) {
          clearInterval(intervalRef.current!);
          setIsPolling(false);

          await saveTokens(response.data.accessToken, response.data.refreshToken);
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [email]);

  return (
    <View style={styles.container}>
      <Logo style={styles.logo} />

      <Text style={styles.emoji}>📬</Text>

      <Text style={styles.title}>Check your email!</Text>

      <Text style={styles.subtitle}>
        We sent a verification link to{'\n'}
        <Text style={styles.email}>{email}</Text>
      </Text>

      <Text style={styles.hint}>
        Click the link in the email to activate your account.{'\n'}
        The link expires in 24 hours.
      </Text>

      {isPolling && (
        <View style={styles.pollingRow}>
          <ActivityIndicator size="small" color={COLORS.gold} />
          <Text style={styles.pollingText}>Waiting for verification...</Text>
        </View>
      )}

      <View style={styles.buttons}>
        <OutlineButton
          label="Back to Sign In"
          onPress={() => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            navigation.navigate('Login');
          }}
        />
      </View>

      <TouchableOpacity
        onPress={() => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          navigation.navigate('Register');
        }}
      >
        <Text style={styles.resendText}>
          Wrong email?{' '}
          <Text style={styles.resendAccent}>Register again</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 32, alignSelf: 'center', width: '100%', maxWidth: 480 },
  logo: { fontSize: 24, marginBottom: 40 },
  emoji: { fontSize: 64, marginBottom: 24 },
  title: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.white, marginBottom: 16, textAlign: 'center' },
  subtitle: { fontFamily: FONTS.regular, fontSize: 15, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 24, marginBottom: 16 },
  email: { fontFamily: FONTS.semiBold, color: COLORS.gold },
  hint: { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  pollingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 28 },
  pollingText: { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  buttons: { width: '100%', maxWidth: 400, marginBottom: 20 },
  resendText: { fontFamily: FONTS.regular, fontSize: 14, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' },
  resendAccent: { color: COLORS.pink, fontWeight: '500' },
});