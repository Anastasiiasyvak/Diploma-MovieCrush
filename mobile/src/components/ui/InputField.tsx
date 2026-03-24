import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardTypeOptions, ViewStyle,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface InputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  error?: string;
  success?: boolean;
  successMessage?: string;
  isPassword?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;
  style?: ViewStyle;
}

export const InputField: React.FC<InputFieldProps> = ({
  value,
  onChangeText,
  placeholder,
  error,
  success,
  successMessage = 'Looks good',
  isPassword = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  onBlur,
  onFocus,
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const inputStyle = [
    styles.input,
    isFocused && styles.inputFocused,
    error ? styles.inputError : null,
    success && !error ? styles.inputValid : null,
    isPassword && styles.passwordInput,
  ];

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.row}>
        <TextInput
          style={inputStyle}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(p => !p)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.errorText}>⚠ {error}</Text>
      ) : success && value ? (
        <Text style={styles.successText}>✓ {successMessage}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: '100%', maxWidth: 400, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, backgroundColor: COLORS.transparent, borderWidth: 2, borderColor: COLORS.gold, borderRadius: 16, padding: 14, color: COLORS.white, fontSize: 16, fontFamily: FONTS.regular },
  inputFocused: { borderColor: COLORS.pink },
  inputError: { borderColor: COLORS.error },
  inputValid: { borderColor: COLORS.success },
  passwordInput: { paddingRight: 48 },
  eyeButton: { position: 'absolute', right: 14, padding: 4 },
  eyeIcon: { fontSize: 18 },
  errorText: { color: COLORS.error,   fontSize: 12, fontFamily: FONTS.regular, marginTop: 5, marginLeft: 4 },
  successText: { color: COLORS.success, fontSize: 12, fontFamily: FONTS.regular, marginTop: 5, marginLeft: 4 },
});