import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'danger' | 'normal';
  hideCancel?: boolean;
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
  confirmStyle = 'normal',
  hideCancel = false,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel || onConfirm}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          
          <View style={styles.buttonRow}>
            {!hideCancel && onCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                confirmStyle === 'danger' && styles.dangerButton,
                hideCancel && !onCancel ? styles.fullWidthButton : null,
              ]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.confirmButtonText,
                confirmStyle === 'danger' && styles.dangerButtonText,
              ]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#222222',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
  },
  fullWidthButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#333333',
  },
  cancelButtonText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#888888',
  },
  confirmButton: {
    backgroundColor: COLORS.gold,
  },
  confirmButtonText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.background,
  },
  dangerButton: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  dangerButtonText: {
    color: COLORS.error,
  },
});