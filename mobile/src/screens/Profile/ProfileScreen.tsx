import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal,
  TextInput, Dimensions, Platform, StatusBar, Switch,
  Pressable, Alert, Image,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { Logo } from '../../components/ui/Logo';
import { StatCard } from '../../components/ui/StatCard';
import { SocialButton } from '../../components/ui/SocialButton';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { profileService, ProfileData, UserList } from '../../services/profileService';
import { clearTokens } from '../../services/storage';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const MAX_WIDTH = 480;
const CONTENT_WIDTH = Math.min(width, MAX_WIDTH);
const GRID_ITEM_SIZE = (CONTENT_WIDTH - 4) / 3;


const showAlert = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert(title, message);
  }
};


const Avatar: React.FC<{ imageUrl?: string; size?: number }> = ({ imageUrl, size = 84 }) => (
  <View style={[styles.avatarWrapper, { width: size, height: size, borderRadius: size / 2 }]}>
    {imageUrl ? (
      <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
    ) : (
      <View style={[styles.avatarPlaceholder, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={styles.silhouetteHead} />
        <View style={styles.silhouetteBody} />
      </View>
    )}
  </View>
);


const EmptyGridItem: React.FC = () => (
  <View style={[styles.gridCell, { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE }]}>
    <View style={styles.gridCellInner}>
      <View style={styles.filmIcon}>
        <View style={styles.filmRect} />
        <View style={styles.filmPlay} />
      </View>
    </View>
  </View>
);

export default function ProfileScreen({ navigation }: any) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('watched');
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListPrivate, setNewListPrivate] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [friendsType, setFriendsType] = useState<'friends' | 'followers' | 'following'>('friends');
  const [deleteAlert, setDeleteAlert] = useState<{ visible: boolean; list: UserList | null }>({
    visible: false, list: null,
  });
  const [privacyAlert, setPrivacyAlert] = useState<{ visible: boolean; list: UserList | null; newPrivacy: boolean }>({
    visible: false, list: null, newPrivacy: false,
  });

  const loadProfile = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await profileService.getMyProfile();
      setProfileData(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        await clearTokens();
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadProfile(true);
    }, [loadProfile])
  );

  const handleRefresh = () => loadProfile(true);

  const closeCreateList = () => {
    setShowCreateList(false);
    setNewListName('');
    setNewListPrivate(false);
    setIsCreatingList(false);
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setIsCreatingList(true);
    try {
      const { list } = await profileService.createCustomList(newListName.trim(), newListPrivate);
      setProfileData(prev => prev ? {
        ...prev,
        user: { ...prev.user, custom_lists_count: prev.user.custom_lists_count + 1 },
        lists: [...prev.lists, list],
      } : prev);
      closeCreateList();
      setActiveTab(list.id.toString());
    } catch (err) {
      console.error('Create list error:', err);
      showAlert('Error', 'Could not create list. Try again.');
    } finally {
      setIsCreatingList(false);
    }
  };

  const confirmDelete = async () => {
    const list = deleteAlert.list;
    if (!list) return;
    setDeleteAlert({ visible: false, list: null });
    try {
      await profileService.deleteCustomList(list.id);
      setProfileData(prev => prev ? {
        ...prev,
        user: { ...prev.user, custom_lists_count: Math.max(0, prev.user.custom_lists_count - 1) },
        lists: prev.lists.filter(l => l.id !== list.id),
      } : prev);
      setActiveTab('watched');
    } catch (err) {
      console.error('Delete error:', err);
      showAlert('Error', 'Could not delete list. Try again.');
    }
  };

  const confirmTogglePrivacy = async () => {
    const { list, newPrivacy } = privacyAlert;
    if (!list) return;
    setPrivacyAlert({ visible: false, list: null, newPrivacy: false });
    try {
      const { list: updated } = await profileService.toggleListPrivacy(list.id, newPrivacy);
      setProfileData(prev => prev ? {
        ...prev,
        lists: prev.lists.map(l => l.id === updated.id ? updated : l),
      } : prev);
    } catch (err) {
      console.error('Toggle privacy error:', err);
      showAlert('Error', 'Could not update list privacy.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (!profileData) return null;

  const { user, lists } = profileData;
  const customLists = lists.filter(l => l.list_type === 'custom');
  const activeCustomList = customLists.find(l => l.id.toString() === activeTab);
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');

  const formatMemberSince = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const defaultTabs = [
    { key: 'watched', label: 'Watched' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'watchlist', label: 'Watchlist' },
  ];

  const friendsCount =
    friendsType === 'friends' ? user.friends_count :
    friendsType === 'followers' ? user.followers_count :
    user.following_count;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={COLORS.gold} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.inner}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Logo />
            <TouchableOpacity onPress={() => navigation.navigate('Settings')} activeOpacity={0.7}>
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Hero */}
          <View style={styles.heroSection}>
            <Avatar imageUrl={user.profile_image_url} size={84} />
            <Text style={styles.username}>{user.username}</Text>
            {fullName ? <Text style={styles.fullName}>{fullName}</Text> : null}
            <Text style={styles.memberSince}>Member since {formatMemberSince(user.created_at)}</Text>
            {(user.telegram_username || user.instagram_username) && (
              <View style={styles.socialsRow}>
                <SocialButton type="telegram" username={user.telegram_username} />
                <SocialButton type="instagram" username={user.instagram_username} />
              </View>
            )}
          </View>

          {/* Friends / Followers / Following */}
          <View style={styles.followRow}>
            {(['friends', 'followers', 'following'] as const).map((type, i) => {
              const count =
                type === 'friends' ? user.friends_count :
                type === 'followers' ? user.followers_count :
                user.following_count;
              return (
                <React.Fragment key={type}>
                  {i > 0 && <View style={styles.followDivider} />}
                  <TouchableOpacity
                    style={styles.followCell}
                    onPress={() => { setFriendsType(type); setShowFriendsModal(true); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.followNum}>{count.toLocaleString()}</Text>
                    <Text style={styles.followLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard value={user.movies_watched} label="Movies" />
            <StatCard value={user.series_watched} label="Series" />
            <StatCard value={user.episodes_watched} label="Episodes" />
          </View>

          {/* Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
            contentContainerStyle={styles.tabsContainer}
            keyboardShouldPersistTaps="handled"
          >
            {defaultTabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}

            {customLists.map(list => (
              <TouchableOpacity
                key={list.id}
                style={[styles.tab, activeTab === list.id.toString() && styles.tabActive]}
                onPress={() => setActiveTab(list.id.toString())}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabLabel, activeTab === list.id.toString() && styles.tabLabelActive]}>
                  {list.name}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.tab, styles.tabAdd]}
              onPress={() => setShowCreateList(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabLabelAdd}>+ List</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Custom list controls */}
          {activeCustomList && (
            <View style={styles.listControlRow}>
              <TouchableOpacity
                onPress={() => setPrivacyAlert({
                  visible: true,
                  list: activeCustomList,
                  newPrivacy: !activeCustomList.is_private,
                })}
                activeOpacity={0.7}
                style={styles.privacyToggle}
              >
                <Text style={styles.privacyToggleText}>
                  {activeCustomList.is_private ? '🔒 Private' : '🌍 Public'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDeleteAlert({ visible: true, list: activeCustomList })}
                activeOpacity={0.7}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteBtnText}>Delete list</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Grid placeholder */}
          <View style={styles.grid}>
            {[0, 1, 2, 3, 4, 5].map(i => <EmptyGridItem key={i} />)}
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeTab === 'watched' ? 'No movies watched yet' :
               activeTab === 'favorites' ? 'No favorites yet' :
               activeTab === 'watchlist' ? 'Your watchlist is empty' :
               'This list is empty'}
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Delete Alert */}
      {deleteAlert.visible && deleteAlert.list && (
        <CustomAlert
          visible={deleteAlert.visible}
          title="Delete list?"
          message={`Are you sure you want to delete "${deleteAlert.list.name}"?`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteAlert({ visible: false, list: null })}
          confirmText="Delete"
          cancelText="Cancel"
          confirmStyle="danger"
        />
      )}

      {/* Privacy Alert */}
      {privacyAlert.visible && privacyAlert.list && (
        <CustomAlert
          visible={privacyAlert.visible}
          title={privacyAlert.newPrivacy ? 'Make private?' : 'Make public?'}
          message={`Are you sure you want to make "${privacyAlert.list.name}" ${privacyAlert.newPrivacy ? 'private' : 'public'}?`}
          onConfirm={confirmTogglePrivacy}
          onCancel={() => setPrivacyAlert({ visible: false, list: null, newPrivacy: false })}
          confirmText={privacyAlert.newPrivacy ? 'Make Private' : 'Make Public'}
          cancelText="Cancel"
          confirmStyle="normal"
        />
      )}

      {/* Create List Modal */}
      <Modal visible={showCreateList} transparent animationType="fade" onRequestClose={closeCreateList}>
        <Pressable style={styles.createOverlay} onPress={closeCreateList}>
          <Pressable style={styles.createCard} onPress={() => {}}>
            <View style={styles.createHeader}>
              <Text style={styles.createTitle}>Create new list</Text>
              <TouchableOpacity onPress={closeCreateList} activeOpacity={0.7}>
                <Text style={styles.createCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.createBody}>
              <TextInput
                style={styles.createInput}
                placeholder="List name..."
                placeholderTextColor="#666"
                value={newListName}
                onChangeText={setNewListName}
                maxLength={30}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreateList}
              />

              <View style={styles.createPrivacyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.createPrivacyLabel}>
                    {newListPrivate ? '🔒 Private' : '🌍 Public'}
                  </Text>
                  <Text style={styles.createPrivacyHint}>
                    {newListPrivate ? 'Only you can see this list' : 'Anyone can see this list'}
                  </Text>
                </View>
                <Switch
                  value={newListPrivate}
                  onValueChange={setNewListPrivate}
                  trackColor={{ false: '#2a2a2a', true: COLORS.gold }}
                  thumbColor={newListPrivate ? COLORS.background : COLORS.cardTextLight}
                />
              </View>

              <TouchableOpacity
                style={[styles.createBtn, !newListName.trim() && styles.createBtnDisabled]}
                onPress={handleCreateList}
                disabled={!newListName.trim() || isCreatingList}
                activeOpacity={0.8}
              >
                {isCreatingList
                  ? <ActivityIndicator color={COLORS.background} />
                  : <Text style={styles.createBtnText}>Create</Text>
                }
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Friends Modal */}
      <Modal visible={showFriendsModal} transparent animationType="fade" onRequestClose={() => setShowFriendsModal(false)}>
        <Pressable style={styles.friendsOverlay} onPress={() => setShowFriendsModal(false)}>
          <Pressable style={styles.friendsCard} onPress={() => {}}>
            <View style={styles.friendsHeader}>
              <Text style={styles.friendsTitle}>
                {friendsType.charAt(0).toUpperCase() + friendsType.slice(1)}
              </Text>
              <TouchableOpacity onPress={() => setShowFriendsModal(false)} activeOpacity={0.7}>
                <Text style={styles.friendsCloseBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.friendsBody}>
              <Text style={styles.emptyFriendsIcon}>👥</Text>
              <Text style={styles.emptyFriendsText}>
                {friendsType === 'friends' ? 'No friends yet' :
                 friendsType === 'followers' ? 'No followers yet' :
                 'Not following anyone yet'}
              </Text>
              <Text style={styles.emptyFriendsCount}>{friendsCount} {friendsType}</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// Styles 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { alignItems: 'center' },
  inner: { width: '100%', maxWidth: MAX_WIDTH },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 36,
    paddingBottom: 12,
  },
  settingsIcon: { fontSize: 20, color: COLORS.cardTextLight },

  heroSection: { alignItems: 'center', paddingHorizontal: 20 },
  avatarWrapper: { borderWidth: 2.5, borderColor: COLORS.gold, overflow: 'hidden', marginBottom: 12 },
  avatarImage: { width: '100%', height: '100%', borderRadius: 999 },
  avatarPlaceholder: { backgroundColor: COLORS.cardDark, alignItems: 'center', justifyContent: 'center' },
  silhouetteHead: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#333', marginBottom: 2, marginTop: -8 },
  silhouetteBody: { width: 44, height: 24, borderRadius: 22, backgroundColor: '#333' },
  username: { fontFamily: FONTS.semiBold, fontSize: 18, color: COLORS.pink, marginBottom: 2 },
  fullName: { fontFamily: FONTS.regular, fontSize: 13, color: '#666666', marginBottom: 4 },
  memberSince: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.darkGray, marginBottom: 14 },
  socialsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },

  followRow: { flexDirection: 'row', borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: COLORS.cardDark, marginBottom: 16 },
  followCell: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  followDivider: { width: 0.5, backgroundColor: COLORS.cardDark },
  followNum: { fontFamily: FONTS.semiBold, fontSize: 17, color: COLORS.gold },
  followLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.cardTextLight, marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 20 },

  tabsScroll: { marginBottom: 0 },
  tabsContainer: { paddingHorizontal: 20, gap: 4, borderBottomWidth: 0.5, borderBottomColor: COLORS.cardDark },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.gold },
  tabAdd: { marginLeft: 4 },
  tabLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.cardTextLight },
  tabLabelActive: { color: COLORS.gold },
  tabLabelAdd: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.pink },

  listControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.cardDark,
  },
  privacyToggle: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, borderWidth: 0.5, borderColor: '#333' },
  privacyToggleText: { fontFamily: FONTS.regular, fontSize: 12, color: '#888888' },
  deleteBtn: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 12, borderWidth: 0.5, borderColor: 'rgba(255,77,77,0.3)' },
  deleteBtnText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.error },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, paddingTop: 2 },
  gridCell: { backgroundColor: '#0d0d0d' },
  gridCellInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filmIcon: { alignItems: 'center', opacity: 0.12 },
  filmRect: { width: 22, height: 16, borderRadius: 2, borderWidth: 1, borderColor: '#fff' },
  filmPlay: {
    width: 0, height: 0,
    borderLeftWidth: 7, borderTopWidth: 5, borderBottomWidth: 5,
    borderLeftColor: '#fff',
    borderTopColor: COLORS.transparent,
    borderBottomColor: COLORS.transparent,
    marginTop: -11, marginLeft: 2,
  },

  emptyState: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontFamily: FONTS.regular, fontSize: 13, color: '#2a2a2a' },

  createOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  createCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#222',
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  createHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.cardDark,
  },
  createTitle: { fontFamily: FONTS.semiBold, fontSize: 18, color: COLORS.white },
  createCloseBtn: { fontSize: 18, color: COLORS.cardTextLight, paddingHorizontal: 4 },
  createBody: { padding: 20, gap: 16 },
  createInput: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: 12,
    padding: 14,
    color: COLORS.white,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  createPrivacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  createPrivacyLabel: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.white, marginBottom: 2 },
  createPrivacyHint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.cardTextLight },
  createBtn: { backgroundColor: COLORS.gold, borderRadius: 50, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.background },

  friendsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  friendsCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#222',
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  friendsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.cardDark,
  },
  friendsTitle: { fontFamily: FONTS.semiBold, fontSize: 18, color: COLORS.white },
  friendsCloseBtn: { fontSize: 18, color: COLORS.cardTextLight, paddingHorizontal: 4 },
  friendsBody: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  emptyFriendsIcon: { fontSize: 36, marginBottom: 12 },
  emptyFriendsText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.cardTextLight, marginBottom: 6 },
  emptyFriendsCount: { fontFamily: FONTS.semiBold, fontSize: 13, color: '#333333' },
});