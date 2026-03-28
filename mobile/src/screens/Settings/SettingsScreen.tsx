import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Platform, StatusBar, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { Logo } from '../../components/ui/Logo';
import { InputField } from '../../components/ui/InputField';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { SettingsModal } from '../../components/ui/SettingsModal';
import { SettingsRow } from '../../components/ui/SettingsRow';
import { SettingsSection } from '../../components/ui/SettingsSection';
import { profileService, UserProfile } from '../../services/profileService';
import { settingsService } from '../../services/settingsService';
import { clearTokens } from '../../services/storage';
import { Ionicons } from '@expo/vector-icons';

const MAX_WIDTH = 480;

type ModalType = 'username' | 'name' | 'password' | 'telegram' | 'instagram' | null;

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  confirmStyle: 'danger' | 'normal';
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

const ALERT_HIDDEN: AlertState = {
  visible: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  confirmStyle: 'normal',
  hideCancel: false,
  onConfirm: () => {},
  onCancel: undefined,
};

const COMING_SOON = (setAlert: (a: AlertState) => void) => ({
  visible: true,
  title: 'Coming soon',
  message: 'This feature will be available soon!',
  confirmText: 'OK',
  confirmStyle: 'normal' as const,
  hideCancel: true,
  onConfirm: () => setAlert(ALERT_HIDDEN),
});

export default function SettingsScreen({ navigation }: any) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [fieldError, setFieldError] = useState('');
  const [alert, setAlert] = useState<AlertState>(ALERT_HIDDEN);

  // Field states
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [telegram, setTelegram] = useState('');
  const [instagram, setInstagram] = useState('');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdErrors, setPwdErrors] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    (async () => {
      try {
        const data = await profileService.getMyProfile();
        const u = data.user;
        setUser(u);
        setUsername(u.username);
        setFirstName(u.first_name || '');
        setLastName(u.last_name || '');
        setTelegram(u.telegram_username || '');
        setInstagram(u.instagram_username || '');
      } catch {
        setAlert({
          visible: true,
          title: 'Error',
          message: 'Could not load profile.',
          confirmText: 'OK',
          confirmStyle: 'normal',
          hideCancel: true,
          onConfirm: () => setAlert(ALERT_HIDDEN),
        });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const openModal = (m: ModalType) => {
    setFieldError('');
    setCurrentPwd('');
    setNewPwd('');
    setConfirmPwd('');
    setModal(m);
  };

  const closeModal = () => {
    setModal(null);
    setFieldError('');
    setPwdErrors({ current: '', new: '', confirm: '' });
  };

  const showError = (message: string) => {
    setAlert({
      visible: true,
      title: 'Error',
      message,
      confirmText: 'OK',
      confirmStyle: 'normal',
      hideCancel: true,
      onConfirm: () => setAlert(ALERT_HIDDEN),
    });
  };

  // Save handlers

  const saveUsername = async () => {
    setIsSaving(true);
    setFieldError('');
    try {
      const { user: u } = await settingsService.updateUsername(username.trim());
      setUser(u);
      closeModal();
    } catch (err: any) {
      setFieldError(err.response?.data?.error || 'Could not update username.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveName = async () => {
    setIsSaving(true);
    try {
      const { user: u } = await settingsService.updateName(
        firstName.trim() || null,
        lastName.trim() || null,
      );
      setUser(u);
      closeModal();
    } catch {
      showError('Could not update name.');
    } finally {
      setIsSaving(false);
    }
  };

  const savePassword = async () => {
    const errors = { current: '', new: '', confirm: '' };

    if (!currentPwd) errors.current = 'Current password is required';

    if (!newPwd) {
      errors.new = 'New password is required';
    } else if (newPwd.length < 8) {
      errors.new = 'At least 8 characters';
    } else if (!/[A-Z]/.test(newPwd)) {
      errors.new = 'Add an uppercase letter';
    } else if (!/[a-z]/.test(newPwd)) {
      errors.new = 'Add a lowercase letter';
    } else if (!/[0-9]/.test(newPwd)) {
      errors.new = 'Add a number';
    }

    if (!confirmPwd) {
      errors.confirm = 'Please confirm your password';
    } else if (newPwd !== confirmPwd) {
      errors.confirm = 'Passwords do not match';
    }

    setPwdErrors(errors);
    if (errors.current || errors.new || errors.confirm) return;

    setIsSaving(true);
    try {
      await settingsService.changePassword(currentPwd, newPwd);
      closeModal();
      setPwdErrors({ current: '', new: '', confirm: '' });
      setAlert({
        visible: true,
        title: 'Success',
        message: 'Your password has been updated.',
        confirmText: 'OK',
        confirmStyle: 'normal',
        hideCancel: true,
        onConfirm: () => setAlert(ALERT_HIDDEN),
      });
    } catch (err: any) {
      setPwdErrors(prev => ({
        ...prev,
        current: err.response?.data?.error || 'Could not change password.',
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const saveTelegram = async () => {
    setIsSaving(true);
    try {
      const { user: u } = await settingsService.updateSocials(
        user?.instagram_username,
        telegram.replace(/^@/, '').trim() || undefined,
      );
      setUser(u);
      closeModal();
    } catch {
      showError('Could not update Telegram.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveInstagram = async () => {
    setIsSaving(true);
    try {
      const { user: u } = await settingsService.updateSocials(
        instagram.replace(/^@/, '').trim() || undefined,
        user?.telegram_username,
      );
      setUser(u);
      closeModal();
    } catch {
      showError('Could not update Instagram.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeSocial = (type: 'telegram' | 'instagram') => {
    setAlert({
      visible: true,
      title: 'Remove link?',
      message: `Remove your ${type === 'telegram' ? 'Telegram' : 'Instagram'} link?`,
      confirmText: 'Remove',
      confirmStyle: 'danger',
      hideCancel: false,
      onConfirm: async () => {
        setAlert(ALERT_HIDDEN);
        try {
          const { user: u } = await settingsService.updateSocials(
            type === 'instagram' ? undefined : user?.instagram_username,
            type === 'telegram'  ? undefined : user?.telegram_username,
          );
          setUser(u);
          if (type === 'telegram')  setTelegram('');
          if (type === 'instagram') setInstagram('');
        } catch {
          showError('Could not remove link.');
        }
      },
      onCancel: () => setAlert(ALERT_HIDDEN),
    });
  };

  const toggleSoulmate = async (val: boolean) => {
    try {
      await settingsService.updateSoulmate(val);
      setUser(prev => prev ? { ...prev, soulmate_consent: val } : prev);
    } catch {
      showError('Could not update preference.');
    }
  };

  const handleLogout = () => {
    setAlert({
      visible: true,
      title: 'Log out?',
      message: 'Are you sure you want to log out?',
      confirmText: 'Log out',
      confirmStyle: 'danger',
      hideCancel: false,
      onConfirm: async () => {
        setAlert(ALERT_HIDDEN);
        await clearTokens();
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      },
      onCancel: () => setAlert(ALERT_HIDDEN),
    });
  };

  const handleDeleteAccount = () => {
    setAlert({
      visible: true,
      title: 'Delete account?',
      message: 'Your account will be deactivated. Contact support within 30 days to restore it.',
      confirmText: 'Delete',
      confirmStyle: 'danger',
      hideCancel: false,
      onConfirm: async () => {
        setAlert(ALERT_HIDDEN);
        try {
          await settingsService.deleteAccount();
          await clearTokens();
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        } catch {
          showError('Could not delete account. Try again.');
        }
      },
      onCancel: () => setAlert(ALERT_HIDDEN),
    });
  };

  if (isLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={styles.centered}>
        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Logo />
            <View style={{ width: 40 }} />
          </View>

          <Text style={styles.pageTitle}>Profile Settings</Text>

          {/* Photo */}
          <SettingsSection label="Photo">
            <SettingsRow
              icon="👤"
              label="Profile photo"
              sub="Upload a new photo"
              onPress={() => setAlert({ ...COMING_SOON(setAlert), message: 'Photo upload will be available soon!' })}
              showArrow
              isLast
            />
          </SettingsSection>

          {/* Profile info */}
          <SettingsSection label="Profile info">
            <SettingsRow icon="@"  label="Username" sub={user.username} onPress={() => openModal('username')} showArrow />
            <SettingsRow icon="✏️" label="First & last name" sub={fullName || 'Not set'} onPress={() => openModal('name')}     showArrow />
            <SettingsRow icon="🔑" label="Change password"  sub="Update your password" onPress={() => openModal('password')} showArrow isLast />
            <SettingsRow
              icon="✉️"
              label="Email"
              sub={user.email}
              onPress={() => setAlert({ ...COMING_SOON(setAlert), message: 'Email change will be available soon!' })}
              showArrow
            />
          </SettingsSection>

          {/* Social links */}
          <SettingsSection label="Social links">
            <SettingsRow
              icon="telegram"
              label="Telegram"
              sub={user.telegram_username ? `@${user.telegram_username}` : 'Not connected'}
              onPress={() => openModal('telegram')}
              right={user.telegram_username
                ? (
                  <TouchableOpacity onPress={() => removeSocial('telegram')} activeOpacity={0.7} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                )
                : undefined}
              showArrow={!user.telegram_username}
            />
            <SettingsRow
              icon="instagram"
              label="Instagram"
              sub={user.instagram_username ? `@${user.instagram_username}` : 'Not connected'}
              onPress={() => openModal('instagram')}
              right={user.instagram_username
                ? (
                  <TouchableOpacity onPress={() => removeSocial('instagram')} activeOpacity={0.7} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                )
                : undefined}
              showArrow={!user.instagram_username}
              isLast
            />
          </SettingsSection>

          {/* Preferences */}
          <SettingsSection label="Preferences">
            <SettingsRow
              icon="💝"
              label="Find my soulmate"
              sub="Join the year-end matching"
              right={
                <Switch
                  value={user.soulmate_consent}
                  onValueChange={toggleSoulmate}
                  trackColor={{ false: '#2a2a2a', true: COLORS.gold }}
                  thumbColor={user.soulmate_consent ? COLORS.background : '#555'}
                />
              }
            />
            <SettingsRow
              icon="⭐"
              label="Subscription"
              sub="Current plan"
              right={
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{user.subscription_type.toUpperCase()}</Text>
                </View>
              }
              onPress={() => setAlert({ ...COMING_SOON(setAlert), message: 'Subscription plans coming soon!' })}
              showArrow
              isLast
            />
          </SettingsSection>

          {/* Language */}
          <SettingsSection label="Language">
            <View style={styles.langRow}>
              {(['en', 'uk'] as const).map(lang => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.langBtn, user.language === lang && styles.langBtnActive]}
                  onPress={() => setAlert({ ...COMING_SOON(setAlert), message: 'Language switching coming soon!' })}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.langBtnText, user.language === lang && styles.langBtnTextActive]}>
                    {lang === 'en' ? '🇬🇧 English' : '🇺🇦 Українська'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingsSection>

          {/* Import */}
          <SettingsSection label="Import watchlist">
            <View style={styles.importCard}>
              <Text style={styles.importDesc}>
                Upload a PDF or CSV from your notes app and we'll automatically detect movies and add them to your Watched list. Supported formats: .pdf, .csv
              </Text>
              <TouchableOpacity
                style={styles.importBtn}
                onPress={() => setAlert({ ...COMING_SOON(setAlert), message: 'File import will be available in the next update!' })}
                activeOpacity={0.7}
              >
                <Text style={styles.importBtnText}>📎  Upload file</Text>
                <Text style={styles.importBtnSub}>coming soon</Text>
              </TouchableOpacity>
            </View>
          </SettingsSection>

          {/* Log out */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutBtnText}>Log out</Text>
          </TouchableOpacity>

          {/* Delete account */}
          <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Text style={styles.deleteAccountText}>Delete account</Text>
          </TouchableOpacity>

          <View style={{ height: 48 }} />
        </ScrollView>
      </View>

      <CustomAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        confirmText={alert.confirmText}
        confirmStyle={alert.confirmStyle}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
        hideCancel={alert.hideCancel}
      />

      {/* Username Modal */}
      <SettingsModal
        visible={modal === 'username'}
        title="Change username"
        onClose={closeModal}
        onSave={saveUsername}
        isSaving={isSaving}
        saveDisabled={!username.trim()}
      >
        <InputField
          placeholder="Username"
          value={username}
          onChangeText={v => { setUsername(v); setFieldError(''); }}
          autoCapitalize="none"
          error={fieldError}
        />
      </SettingsModal>

      {/* Name Modal */}
      <SettingsModal
        visible={modal === 'name'}
        title="Edit name"
        onClose={closeModal}
        onSave={saveName}
        isSaving={isSaving}
      >
        <InputField placeholder="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
        <InputField placeholder="Last name"  value={lastName}  onChangeText={setLastName}  autoCapitalize="words" />
      </SettingsModal>

      {/* Password Modal */}
      <SettingsModal
        visible={modal === 'password'}
        title="Change password"
        onClose={closeModal}
        onSave={savePassword}
        isSaving={isSaving}
        saveDisabled={!currentPwd || !newPwd || !confirmPwd}
      >
        <InputField
          placeholder="Current password"
          value={currentPwd}
          onChangeText={v => { setCurrentPwd(v); setPwdErrors(prev => ({ ...prev, current: '' })); }}
          isPassword
          error={pwdErrors.current}
        />
        <InputField
          placeholder="New password"
          value={newPwd}
          onChangeText={v => {
            setNewPwd(v);
            setPwdErrors(prev => ({
              ...prev,
              new: '',
              confirm: confirmPwd && v !== confirmPwd ? 'Passwords do not match' : '',
            }));
          }}
          isPassword
          error={pwdErrors.new}
        />
        <InputField
          placeholder="Confirm new password"
          value={confirmPwd}
          onChangeText={v => {
            setConfirmPwd(v);
            setPwdErrors(prev => ({
              ...prev,
              confirm: v && v !== newPwd ? 'Passwords do not match' : '',
            }));
          }}
          isPassword
          error={pwdErrors.confirm}
        />
      </SettingsModal>

      {/* Telegram Modal */}
      <SettingsModal
        visible={modal === 'telegram'}
        title="Telegram username"
        onClose={closeModal}
        onSave={saveTelegram}
        isSaving={isSaving}
        saveDisabled={!telegram.trim()}
      >
        <InputField placeholder="@username" value={telegram} onChangeText={setTelegram} autoCapitalize="none" />
      </SettingsModal>

      {/* Instagram Modal */}
      <SettingsModal
        visible={modal === 'instagram'}
        title="Instagram username"
        onClose={closeModal}
        onSave={saveInstagram}
        isSaving={isSaving}
        saveDisabled={!instagram.trim()}
      >
        <InputField placeholder="@username" value={instagram} onChangeText={setInstagram} autoCapitalize="none" />
      </SettingsModal>
    </View>
  );
}

// Styles

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  centered:         { flex: 1, maxWidth: MAX_WIDTH, width: '100%', alignSelf: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 8,
  },

  pageTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.white, paddingHorizontal: 20, marginBottom: 24 },

  removeBtn:     { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, borderWidth: 0.5, borderColor: 'rgba(255,77,77,0.3)' },
  removeBtnText: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.error },

  badge:     { backgroundColor: COLORS.cardDark, borderRadius: 6, borderWidth: 0.5, borderColor: '#333', paddingVertical: 2, paddingHorizontal: 8 },
  badgeText: { fontFamily: FONTS.medium, fontSize: 11, color: '#666' },

  langRow:           { flexDirection: 'row', gap: 8, padding: 12 },
  langBtn:           { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 0.5, borderColor: '#333', alignItems: 'center' },
  langBtnActive:     { borderColor: COLORS.gold, backgroundColor: 'rgba(255,215,0,0.06)' },
  langBtnText:       { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.cardTextLight },
  langBtnTextActive: { color: COLORS.gold },

  importCard:    { backgroundColor: '#0d0d0d', borderRadius: 14, borderWidth: 0.5, borderColor: COLORS.cardDark, padding: 14 },
  importDesc:    { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.darkGray, lineHeight: 18, marginBottom: 12 },
  importBtn:     { borderWidth: 0.5, borderColor: '#333', borderStyle: 'dashed', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  importBtnText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.cardTextLight },
  importBtnSub:  { fontFamily: FONTS.regular, fontSize: 11, color: '#333' },

  logoutBtn:         { marginHorizontal: 20, paddingVertical: 14, borderRadius: 50, borderWidth: 1, borderColor: 'rgba(255,77,77,0.35)', backgroundColor: 'rgba(255,77,77,0.06)', alignItems: 'center', marginBottom: 12 },
  logoutBtnText:     { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.error },
  deleteAccountBtn:  { alignItems: 'center', paddingVertical: 8 },
  deleteAccountText: { fontFamily: FONTS.regular, fontSize: 12, color: '#2a2a2a' },
});