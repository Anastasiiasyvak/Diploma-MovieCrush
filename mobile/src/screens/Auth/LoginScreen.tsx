import React, { useState } from 'react';
import {
  Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { authService } from '../../services/api';
import { saveTokens } from '../../services/storage';
import { Logo } from '../../components/ui/Logo';
import { GradientButton } from '../../components/ui/GradientButton';
import { InputField } from '../../components/ui/InputField';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (field: string, value: string): string => {
    if (field === 'email') {
      if (!value) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email';
    }
    if (field === 'password') {
      if (!value) return 'Password is required';
    }
    return '';
  };

  const handleBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleLogin = async () => {
    const emailErr = validateField('email', email);
    const passwordErr = validateField('password', password);
    setFieldErrors({ email: emailErr, password: passwordErr });
    setTouched({ email: true, password: true });
    if (emailErr || passwordErr) return;

    setIsLoading(true);
    try {
      const data = await authService.login({
        email: email.trim().toLowerCase(),
        password,
      });
      await saveTokens(data.accessToken, data.refreshToken);
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err: any) {
      const message = err.response?.data?.error || 'Something went wrong. Please try again.';
      const field = err.response?.data?.field;
      if (field) {
        setFieldErrors({ [field]: message });
      } else {
        setFieldErrors({ general: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Logo style={styles.logo} />

        {fieldErrors.general ? (
          <View style={styles.generalError}>
            <Text style={styles.generalErrorText}>{fieldErrors.general}</Text>
          </View>
        ) : null}

        <InputField
          placeholder="Email"
          value={email}
          onChangeText={v => {
            setEmail(v);
            if (touched.email) setFieldErrors(prev => ({ ...prev, email: validateField('email', v), general: '' }));
          }}
          onBlur={() => handleBlur('email', email)}
          keyboardType="email-address"
          error={touched.email ? fieldErrors.email : ''}
        />

        <InputField
          placeholder="Password"
          value={password}
          onChangeText={v => {
            setPassword(v);
            if (touched.password) setFieldErrors(prev => ({ ...prev, password: validateField('password', v), general: '' }));
          }}
          onBlur={() => handleBlur('password', password)}
          isPassword
          error={touched.password ? fieldErrors.password : ''}
        />

        <TouchableOpacity style={styles.forgotWrapper} onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <GradientButton label="Log In" onPress={handleLogin} isLoading={isLoading} style={styles.button} />

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>
            Don't have an account?{' '}<Text style={styles.linkAccent}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  logo: { fontSize: 36, marginBottom: 40 },
  generalError: { width: '100%', maxWidth: 400, backgroundColor: 'rgba(255,77,77,0.12)', borderWidth: 1, borderColor: 'rgba(255,77,77,0.4)', borderRadius: 12, padding: 12, marginBottom: 16 },
  generalErrorText: { color: COLORS.error, fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center' },
  forgotWrapper: { width: '100%', maxWidth: 400, alignItems: 'flex-end', marginBottom: 8, marginTop: 2 },
  forgotText: { color: COLORS.pink, fontSize: 13, fontFamily: FONTS.regular },
  button: { marginTop: 8, marginBottom: 24, borderRadius: 16 },
  link: { color: COLORS.gray, fontSize: 14, fontStyle: 'italic', fontFamily: FONTS.regular },
  linkAccent: { color: COLORS.pink, fontWeight: '500', fontStyle: 'italic' },
});