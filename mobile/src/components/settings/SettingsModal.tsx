import React from 'react';
import { Modal, Pressable, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface SettingsModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  children: React.ReactNode;
  saveDisabled?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  title,
  onClose,
  onSave,
  isSaving,
  children,
  saveDisabled = false,
}) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.overlay} onPress={onClose}>
      <Pressable style={styles.card} onPress={() => {}}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {children}
          <TouchableOpacity
            style={[styles.saveBtn, (saveDisabled || isSaving) && styles.saveBtnDisabled]}
            onPress={onSave}
            disabled={saveDisabled || isSaving}
            activeOpacity={0.8}
          >
            {isSaving
              ? <ActivityIndicator color={COLORS.background} />
              : <Text style={styles.saveBtnText}>Save</Text>
            }
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#222',
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.cardDark,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 18,
    color: COLORS.white,
  },
  close: {
    fontSize: 18,
    color: COLORS.cardTextLight,
    paddingHorizontal: 4,
  },
  body: {
    padding: 20,
    gap: 16,
  },
  saveBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.background,
  },
});