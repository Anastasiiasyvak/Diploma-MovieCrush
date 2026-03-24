import React, { useState } from 'react';
import {
  Text, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { authService } from '../../services/api';
import { Logo } from '../../components/ui/Logo';
import { GradientButton } from '../../components/ui/GradientButton';
import { InputField } from '../../components/ui/InputField';

// Password strength 

const getPasswordStrength = (password: string) => {
  if (!password) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { label: 'Too weak', color: '#ff4d4d' },
    { label: 'Weak', color: '#ff9900' },
    { label: 'Fair', color: '#ffcc00' },
    { label: 'Good', color: '#99cc00' },
    { label: 'Strong', color: '#00cc66' },
  ];
  return { score, ...levels[score] };
};

// Field validation 

const validateField = (field: string, value: string): string => {
  switch (field) {
    case 'username':
      if (!value) return 'Username is required';
      if (value.length < 3) return 'At least 3 characters';
      if (value.length > 30) return 'Max 30 characters';
      if (!/^[a-zA-Z0-9._]+$/.test(value)) return 'Only letters, numbers, . and _';
      if (value.startsWith('.') || value.startsWith('_')) return 'Cannot start with . or _';
      return '';
    case 'email':
      if (!value) return 'Email is required';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email';
      return '';
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 8) return 'At least 8 characters';
      if (!/[A-Z]/.test(value)) return 'Add an uppercase letter';
      if (!/[a-z]/.test(value)) return 'Add a lowercase letter';
      if (!/[0-9]/.test(value)) return 'Add a number';
      return '';
    default: return '';
  }
};

// Component 

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({ email: '', password: '', username: '', first_name: '', last_name: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched]         = useState<Record<string, boolean>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isLoading, setIsLoading]     = useState(false);

  const passwordStrength = getPasswordStrength(form.password);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setFieldErrors(prev => ({
      ...prev,
      [field]: validateField(field, form[field as keyof typeof form]),
    }));
  };

  const handleRegister = async () => {
    const required = ['username', 'email', 'password'];
    const newErrors: Record<string, string> = {};
    required.forEach(f => { newErrors[f] = validateField(f, form[f as keyof typeof form]); });
    setFieldErrors(newErrors);
    setTouched({ username: true, email: true, password: true });
    if (Object.values(newErrors).some(e => e)) return;

    setIsLoading(true);
    try {
      await authService.register({
        ...form,
        email: form.email.trim().toLowerCase(),
        username: form.username.trim(),
      });
      navigation.replace('CheckEmail', { email: form.email.trim().toLowerCase() });
    } catch (err: any) {
      const serverError = err.response?.data?.error || 'Registration failed. Please try again.';
      const serverField = err.response?.data?.field;
      if (serverField) {
        setFieldErrors(prev => ({ ...prev, [serverField]: serverError }));
      } else {
        setFieldErrors(prev => ({ ...prev, general: serverError }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Logo style={styles.logo} />

        {fieldErrors.general ? (
          <View style={styles.generalError}>
            <Text style={styles.generalErrorText}>{fieldErrors.general}</Text>
          </View>
        ) : null}

        <InputField
          placeholder="Username"
          value={form.username}
          onChangeText={v => handleChange('username', v)}
          onBlur={() => handleBlur('username')}
          onFocus={() => setFocusedField('username')}
          error={touched.username ? fieldErrors.username : ''}
          success={touched.username && !fieldErrors.username}
        />

        <InputField
          placeholder="Email"
          value={form.email}
          onChangeText={v => handleChange('email', v)}
          onBlur={() => handleBlur('email')}
          onFocus={() => setFocusedField('email')}
          keyboardType="email-address"
          error={touched.email ? fieldErrors.email : ''}
          success={touched.email && !fieldErrors.email}
        />

        <InputField
          placeholder="Password"
          value={form.password}
          onChangeText={v => handleChange('password', v)}
          onBlur={() => handleBlur('password')}
          onFocus={() => setFocusedField('password')}
          isPassword
          error={touched.password && focusedField !== 'password' ? fieldErrors.password : ''}
        />

        {form.password.length > 0 && (
          <View style={styles.strengthWrapper}>
            <View style={styles.strengthBarRow}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={[styles.strengthSegment,
                  { backgroundColor: i < passwordStrength.score ? passwordStrength.color : 'rgba(255,255,255,0.15)' }]} />
              ))}
            </View>
            <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>{passwordStrength.label}</Text>
          </View>
        )}

        {focusedField === 'password' && (
          <View style={styles.passwordHints}>
            <PasswordRule met={form.password.length >= 8}   text="At least 8 characters" />
            <PasswordRule met={/[A-Z]/.test(form.password)} text="One uppercase letter" />
            <PasswordRule met={/[a-z]/.test(form.password)} text="One lowercase letter" />
            <PasswordRule met={/[0-9]/.test(form.password)} text="One number" />
          </View>
        )}

        <InputField
          placeholder="First name (optional)"
          value={form.first_name}
          onChangeText={v => handleChange('first_name', v)}
          autoCapitalize="words"
        />

        <InputField
          placeholder="Last name (optional)"
          value={form.last_name}
          onChangeText={v => handleChange('last_name', v)}
          autoCapitalize="words"
        />

        <GradientButton label="Create Account" onPress={handleRegister} isLoading={isLoading} style={styles.button} />

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Already have an account?{' '}<Text style={styles.linkAccent}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

//  Password rule

const PasswordRule = ({ met, text }: { met: boolean; text: string }) => (
  <View style={ruleStyles.row}>
    <Text style={[ruleStyles.icon, { color: met ? COLORS.success : 'rgba(255,255,255,0.35)' }]}>
      {met ? '✓' : '○'}
    </Text>
    <Text style={[ruleStyles.text, { color: met ? COLORS.success : 'rgba(255,255,255,0.45)' }]}>
      {text}
    </Text>
  </View>
);

const ruleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { fontSize: 12, width: 14, textAlign: 'center' },
  text: { fontSize: 12, fontFamily: FONTS.regular },
});

// Styles 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingTop: 48, paddingBottom: 40 },
  logo: { fontSize: 36, marginBottom: 32 },
  generalError: { width: '100%', maxWidth: 400, backgroundColor: 'rgba(255,77,77,0.12)', borderWidth: 1, borderColor: 'rgba(255,77,77,0.4)', borderRadius: 12, padding: 12, marginBottom: 16 },
  generalErrorText: { color: COLORS.error, fontSize: 13, fontFamily: FONTS.regular, textAlign: 'center' },
  strengthWrapper: { width: '100%', maxWidth: 400, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, marginTop: -4 },
  strengthBarRow: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontFamily: FONTS.medium, minWidth: 60, textAlign: 'right' },
  passwordHints: { width: '100%', maxWidth: 400, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 10, gap: 5, marginBottom: 8 },
  button: { marginTop: 16, marginBottom: 24, borderRadius: 16 },
  link: { color: COLORS.gray, fontSize: 14, fontStyle: 'italic', fontFamily: FONTS.regular },
  linkAccent: { color: COLORS.pink, fontWeight: '500', fontStyle: 'italic' },
});