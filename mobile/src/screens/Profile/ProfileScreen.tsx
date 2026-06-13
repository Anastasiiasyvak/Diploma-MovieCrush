import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Modal,
  TextInput, Platform, StatusBar, Switch,
  Pressable, Alert, Image,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { Logo } from '../../components/ui/Logo';
import { StatCard } from '../../components/ui/StatCard';
import { SocialButton } from '../../components/ui/SocialButton';
import { CustomAlert } from '../../components/ui/CustomAlert';
import { profileService, ProfileData, UserList } from '../../services/profileService';
import { clearTokens } from '../../services/storage';
import { Ionicons } from '@expo/vector-icons';
import { ProfileListGrid } from '../../components/profile/ProfileListGrid';
import { FollowListModal, FollowListType } from '../../components/follows/FollowListModal';
import { followsService } from '../../services/followsService';
import { styles } from './ProfileScreen.styles';

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


export default function ProfileScreen({ navigation }: any) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('watched');
  const [showCreateList, setShowCreateList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListPrivate, setNewListPrivate] = useState(false);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [modalType, setModalType] = useState<FollowListType | null>(null);
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

  const getActiveListId = (): number | null => {
    const defaultList = lists.find(l =>
      (activeTab === 'watched'   && l.list_type === 'watched')   ||
      (activeTab === 'favorites' && l.list_type === 'favorites') ||
      (activeTab === 'watchlist' && l.list_type === 'watchlist')
    );
    if (defaultList) return defaultList.id;
    const customList = customLists.find(l => l.id.toString() === activeTab);
    return customList?.id ?? null;
  };
 
  const getActiveListType = (): string => {
    if (activeTab === 'watched')   return 'watched';
    if (activeTab === 'favorites') return 'favorites';
    if (activeTab === 'watchlist') return 'watchlist';
    return 'custom';
  };

  const handleMovieRemoved = (tmdbId: number, listType: string) => {
    if (listType === 'watched') {
      setProfileData(prev => prev ? {
        ...prev,
        user: {
          ...prev.user,
          movies_watched: Math.max(0, prev.user.movies_watched - 1),
        },
      } : prev);
    }
  };

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
                    onPress={() => setModalType(type)}
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

          <ProfileListGrid
            listId={getActiveListId()}
            listType={getActiveListType()}
            onItemPress={(tmdbId, mediaType) => {
              if (mediaType === 'tv') {
                navigation.navigate('Series', {seriesId: tmdbId});
              } else {
                navigation.navigate('Movie', {movieId: tmdbId});
              }
            }}
            onRemoved={handleMovieRemoved}
          />

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

      {modalType && (
        <FollowListModal
          visible={modalType !== null}
          type={modalType}
          load={() => {
            if (modalType === 'friends')   return followsService.getMyFriends();
            if (modalType === 'followers') return followsService.getMyFollowers();
            if (modalType === 'following') return followsService.getMyFollowing();
            return Promise.resolve([]);
          }}
          onClose={() => setModalType(null)}
          onUserPress={(otherUserId) => {
            navigation.navigate('UserProfile', { userId: otherUserId });
          }}
        />
      )}
    </View>
  );
}