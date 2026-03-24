import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { Logo } from '../../components/ui/Logo';
import { GradientButton } from '../../components/ui/GradientButton';
import { InputField } from '../../components/ui/InputField';
import api from '../../services/api';

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const validate = (): string => {
    if (!email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email';
    return '';
  };

  const handleSubmit = async () => {
    setTouched(true);
    const err = validate();
    if (err) { setError(err); return; }

    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setIsSent(true);
    } catch {
      setIsSent(true); 
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <View style={styles.container}>
        <Logo style={styles.logo} />
        <Text style={styles.emoji}>📩</Text>
        <Text style={styles.title}>Check your email!</Text>
        <Text style={styles.subtitle}>
          If <Text style={styles.emailHighlight}>{email}</Text> is registered,{'\n'}
          you'll receive a reset link shortly.
        </Text>
        <Text style={styles.hint}>The link expires in 1 hour.</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
          <Text style={styles.backText}>← Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Logo style={styles.logo} />
      <Text style={styles.emoji}>🔐</Text>
      <Text style={styles.title}>Forgot password?</Text>
      <Text style={styles.subtitle}>
        Enter your email and we'll send you{'\n'}a link to reset your password.
      </Text>

      <InputField
        placeholder="Email"
        value={email}
        onChangeText={v => { setEmail(v); if (touched) setError(validate()); }}
        onBlur={() => { setTouched(true); setError(validate()); }}
        keyboardType="email-address"
        error={touched ? error : ''}
      />

      <GradientButton label="Send Reset Link" onPress={handleSubmit} isLoading={isLoading} style={styles.button} />

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.backButton}>
        <Text style={styles.backText}>← Back to Sign In</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: { fontSize: 24, marginBottom: 32 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontFamily: FONTS.bold, fontSize: 26, color: COLORS.white, marginBottom: 12, textAlign: 'center' },
  subtitle: { fontFamily: FONTS.regular, fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  hint: { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginBottom: 32 },
  emailHighlight: { fontFamily: FONTS.semiBold, color: COLORS.gold },
  button: { width: '100%', maxWidth: 400, marginTop: 8, marginBottom: 24 },
  backButton: { marginTop: 8 },
  backText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.pink, fontStyle: 'italic' },
});