import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Logo } from '../../components/ui/Logo';
import { StatCard } from '../../components/ui/StatCard';
import { SocialButton } from '../../components/ui/SocialButton';
import {
  followsService, UserProfileWithStatus, PublicListSummary,
} from '../../services/followsService';
import { profileService } from '../../services/profileService';
import { FollowListModal, FollowListType } from '../../components/follows/FollowListModal';
import { PublicListGrid } from '../../components/follows/PublicListGrid';
import { styles } from './UserProfileScreen.styles';

const Avatar: React.FC<{ imageUrl?: string | null; size?: number }> = ({
  imageUrl, size = 84,
}) => (
  <View style={[
    styles.avatarWrapper,
    { width: size, height: size, borderRadius: size / 2 },
  ]}>
    {imageUrl ? (
      <Image source={{ uri: imageUrl }} style={styles.avatarImage} />
    ) : (
      <View style={[
        styles.avatarPlaceholder,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
        <View style={styles.silhouetteHead} />
        <View style={styles.silhouetteBody} />
      </View>
    )}
  </View>
);

export default function UserProfileScreen({ route, navigation }: any) {
  const { userId } = route.params as { userId: number };

  const [profile, setProfile] = useState<UserProfileWithStatus | null>(null);
  const [lists, setLists] = useState<PublicListSummary[]>([]);
  const [myId, setMyId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('watched');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const [modalType, setModalType] = useState<FollowListType | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const [profileData, listsData, me] = await Promise.all([
        followsService.getUserProfile(userId),
        followsService.getUserLists(userId),
        profileService.getMyProfile(),
      ]);
      setProfile(profileData);
      setLists(listsData);
      setMyId(me.user.id);
    } catch (err: any) {
      console.error('UserProfile load error:', err);
      setError(err.response?.status === 404
        ? 'User not found'
        : 'Could not load profile. Check your connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadData(true);
    }, [loadData])
  );

  useEffect(() => {
    setActiveTab('watched');
  }, [userId]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(true);
  };

  const handleToggleFollow = async () => {
    if (!profile || isToggling) return;
    setIsToggling(true);

    const wasFollowing = profile.is_following;

    setProfile(prev => prev ? {
      ...prev,
      is_following: !wasFollowing,
      is_friend: !wasFollowing && prev.is_followed_by,
      followers_count: prev.followers_count + (wasFollowing ? -1 : 1),
    } : prev);

    try {
      if (wasFollowing) {
        await followsService.unfollow(userId);
      } else {
        await followsService.follow(userId);
      }
      await loadData(true);
    } catch (err) {
      console.error('Toggle follow error:', err);
      setProfile(prev => prev ? {
        ...prev,
        is_following: wasFollowing,
        is_friend: wasFollowing && prev.is_followed_by,
        followers_count: prev.followers_count + (wasFollowing ? 1 : -1),
      } : prev);
    } finally {
      setIsToggling(false);
    }
  };

  const handleUserPressFromModal = (otherUserId: number) => {
    if (myId !== null && otherUserId === myId) {
      navigation.navigate('Profile');
    } else {
      navigation.push('UserProfile', { userId: otherUserId });
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>{error ?? 'Something went wrong'}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => loadData()}
          activeOpacity={0.8}
        >
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  const isMe = myId !== null && myId === profile.id;

  const defaultTabs = [
    { key: 'watched', label: 'Watched' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'watchlist', label: 'Watchlist' },
  ];
  const customLists = lists.filter(l => l.list_type === 'custom');

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

  const loadListForModal = () => {
    if (modalType === 'friends')   return followsService.getUserFriends(userId);
    if (modalType === 'followers') return followsService.getUserFollowers(userId);
    if (modalType === 'following') return followsService.getUserFollowing(userId);
    return Promise.resolve([]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.gold}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.inner}>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color={COLORS.white} />
            </TouchableOpacity>
            <Logo />
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.heroSection}>
            <Avatar imageUrl={profile.profile_image_url} size={84} />
            <Text style={styles.username}>@{profile.username}</Text>
            {fullName.length > 0 && <Text style={styles.fullName}>{fullName}</Text>}

            {profile.is_friend && (
              <View style={styles.mutualBadge}>
                <Text style={styles.mutualBadgeText}>🤝 Friends</Text>
              </View>
            )}

            {profile.is_friend && (profile.telegram_username || profile.instagram_username) && (
              <View style={styles.socialsRow}>
                <SocialButton type="telegram"  username={profile.telegram_username  ?? undefined} />
                <SocialButton type="instagram" username={profile.instagram_username ?? undefined} />
              </View>
            )}
          </View>

          {!isMe && (
            <View style={styles.followBtnWrap}>
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  profile.is_following ? styles.followBtnUnfollow : styles.followBtnFollow,
                ]}
                onPress={handleToggleFollow}
                disabled={isToggling}
                activeOpacity={0.85}
              >
                {isToggling ? (
                  <ActivityIndicator
                    size="small"
                    color={profile.is_following ? COLORS.pink : COLORS.background}
                  />
                ) : (
                  <Text style={[
                    styles.followBtnText,
                    profile.is_following ? styles.followBtnTextUnfollow : styles.followBtnTextFollow,
                  ]}>
                    {profile.is_following ? '✓ Following' : '+ Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.followRow}>
            {(['friends', 'followers', 'following'] as const).map((type, i) => {
              const count =
                type === 'friends' ? profile.friends_count :
                type === 'followers' ? profile.followers_count :
                profile.following_count;
              return (
                <React.Fragment key={type}>
                  {i > 0 && <View style={styles.followDivider} />}
                  <TouchableOpacity
                    style={styles.followCell}
                    activeOpacity={0.6}
                    onPress={() => setModalType(type)}
                  >
                    <Text style={styles.followNum}>{count.toLocaleString()}</Text>
                    <Text style={styles.followLabel}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>

          <View style={styles.statsRow}>
            <StatCard value={profile.movies_watched}   label="Movies" />
            <StatCard value={profile.series_watched}   label="Series" />
            <StatCard value={profile.episodes_watched} label="Episodes" />
          </View>

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
                <Text style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.tabLabelActive,
                ]}>
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
                <Text style={[
                  styles.tabLabel,
                  activeTab === list.id.toString() && styles.tabLabelActive,
                ]}>
                  {list.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <PublicListGrid
            userId={userId}
            listId={getActiveListId()}
            listType={getActiveListType()}
            onItemPress={(tmdbId, mediaType) => {
              if (mediaType === 'tv') {
                navigation.navigate('Series', { seriesId: tmdbId });
              } else {
                navigation.navigate('Movie', { movieId: tmdbId });
              }
            }}
          />

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {modalType && (
        <FollowListModal
          visible={modalType !== null}
          type={modalType}
          load={loadListForModal}
          onClose={() => setModalType(null)}
          onUserPress={handleUserPressFromModal}
        />
      )}
    </View>
  );
}