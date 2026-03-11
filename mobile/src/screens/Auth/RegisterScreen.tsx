import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/api';
import { saveTokens } from '../../services/storage';

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    first_name: '',
    last_name: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const validate = () => {
    if (!form.email || !form.password || !form.username) {
      setError('Email, password and username are required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setIsLoading(true);
    try {
        const data = await authService.register(form);
        await saveTokens(data.accessToken, data.refreshToken);
        // TODO: перейти на головний екран
        console.log('Registered successfully!');
    } catch (err: any) {
        setError(err.response?.data?.error || 'Registration failed');
    } finally {
        setIsLoading(false);
    }
  };

  const getInputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>MovieCrush</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={getInputStyle('username')}
          placeholder="Username"
          placeholderTextColor={COLORS.gray}
          value={form.username}
          onChangeText={v => handleChange('username', v)}
          onFocus={() => setFocusedField('username')}
          onBlur={() => setFocusedField(null)}
          autoCapitalize="none"
        />
        <TextInput
          style={getInputStyle('email')}
          placeholder="Email"
          placeholderTextColor={COLORS.gray}
          value={form.email}
          onChangeText={v => handleChange('email', v)}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={getInputStyle('password')}
          placeholder="Password"
          placeholderTextColor={COLORS.gray}
          value={form.password}
          onChangeText={v => handleChange('password', v)}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
          secureTextEntry
        />
        <TextInput
          style={getInputStyle('first_name')}
          placeholder="First name (optional)"
          placeholderTextColor={COLORS.gray}
          value={form.first_name}
          onChangeText={v => handleChange('first_name', v)}
          onFocus={() => setFocusedField('first_name')}
          onBlur={() => setFocusedField(null)}
        />
        <TextInput
          style={getInputStyle('last_name')}
          placeholder="Last name (optional)"
          placeholderTextColor={COLORS.gray}
          value={form.last_name}
          onChangeText={v => handleChange('last_name', v)}
          onFocus={() => setFocusedField('last_name')}
          onBlur={() => setFocusedField(null)}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Already have an account?{' '}
            <Text style={styles.linkAccent}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 36,
    color: COLORS.pink,
    fontWeight: '700',
    marginBottom: 40,
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: 16,
    padding: 14,
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: COLORS.pink,
  },
  button: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: COLORS.error,
    marginBottom: 16,
    fontSize: 14,
  },
  link: {
    color: COLORS.gray,
    fontSize: 14,
    fontStyle: 'italic',
  },
  linkAccent: {
    color: COLORS.pinkDark,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});