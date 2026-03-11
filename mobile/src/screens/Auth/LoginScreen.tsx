import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  View,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { authService } from '../../services/api';
import { saveTokens } from '../../services/storage';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
        setError('Please fill in all fields');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
        const data = await authService.login({ email, password });
        await saveTokens(data.accessToken, data.refreshToken);
        // TODO: перейти на головний екран
        console.log('Logged in successfully!');
    } catch (err: any) {
        setError(err.response?.data?.error || 'Login failed');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>MovieCrush</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={[styles.input, focusedField === 'email' && styles.inputFocused]}
          placeholder="Email"
          placeholderTextColor={COLORS.gray}
          value={email}
          onChangeText={v => { setEmail(v); if (error) setError(''); }}
          onFocus={() => setFocusedField('email')}
          onBlur={() => setFocusedField(null)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, focusedField === 'password' && styles.inputFocused]}
          placeholder="Password"
          placeholderTextColor={COLORS.gray}
          value={password}
          onChangeText={v => { setPassword(v); if (error) setError(''); }}
          onFocus={() => setFocusedField('password')}
          onBlur={() => setFocusedField(null)}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <Text style={styles.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>
            Don't have an account?{' '}
            <Text style={styles.linkAccent}>Sign up here</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
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
    color: COLORS.pink,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});