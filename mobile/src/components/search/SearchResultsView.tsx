import React from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  ActivityIndicator, StyleSheet, Dimensions,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { POSTER_SIZES } from '../../constants/tmdb';
import { SearchTab } from './SearchBar';

// ── Layout (3 cols — як в Recommendations) ────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH  = 480;
const CONTENT_W  = Math.min(SCREEN_WIDTH, MAX_WIDTH);
const COLS       = 3;
const CARD_GAP   = 10;
const SIDE_PAD   = 16;
const CARD_W     = (CONTENT_W - SIDE_PAD * 2 - CARD_GAP * (COLS - 1)) / COLS;
const CARD_H     = CARD_W * 1.5;

// ── Types ─────────────────────────────────────────────────────────────────────
export interface MediaResult {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  year: string;
  posterPath: string | null;
  rating: number;
}

export interface CastResult {
  id: number;
  name: string;
  role: string;
  profilePath: string | null;
  knownFor: string;
}

export interface UserResult {
  id: number;
  username: string;
  fullName: string;
  profileImageUrl: string | null;
  moviesWatched: number;
  seriesWatched: number;
  isFollowedByMe: boolean;
}

interface SearchResultsViewProps {
  tab: SearchTab;
  isLoading: boolean;
  mediaResults: MediaResult[];
  castResults: CastResult[];
  userResults: UserResult[];
  query: string;
  navigation?: any;
}

// ── Media card ────────────────────────────────────────────────────────────────
const MediaCard: React.FC<{
  item: MediaResult;
  index: number;
  onPress?: () => void;
}> = ({ item, index, onPress }) => {

  const posterUrl = item.posterPath ? `${POSTER_SIZES.medium}${item.posterPath}` : null;

  return (
    <TouchableOpacity
      style={[styles.mediaCard, { marginLeft: index % COLS !== 0 ? CARD_GAP : 0 }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.mediaPoster}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.posterImg} resizeMode="cover" />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Text style={{ fontSize: 26 }}>🎬</Text>
          </View>
        )}

        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
        </View>

        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {item.mediaType === 'movie' ? 'Movie' : 'Series'}
          </Text>
        </View>
      </View>

      <Text style={styles.mediaTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.mediaYear}>{item.year}</Text>
    </TouchableOpacity>
  );
};

// ── Cast card ─────────────────────────────────────────────────────────────────
const CastCard: React.FC<{
  item: CastResult;
  index: number;
  onPress: () => void;
}> = ({ item, index, onPress }) => {

  const photoUrl = item.profilePath
    ? `${POSTER_SIZES.medium}${item.profilePath}`
    : null;

  return (
    <TouchableOpacity
      style={[styles.mediaCard, { marginLeft: index % COLS !== 0 ? CARD_GAP : 0 }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={[styles.mediaPoster, styles.castPoster]}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.posterImg} resizeMode="cover" />
        ) : (
          <View style={styles.posterPlaceholder}>
            <Text style={{ fontSize: 26 }}>🎭</Text>
          </View>
        )}

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{item.role}</Text>
        </View>
      </View>

      <Text style={styles.mediaTitle} numberOfLines={2}>{item.name}</Text>
      <Text style={styles.mediaYear} numberOfLines={1}>{item.knownFor}</Text>
    </TouchableOpacity>
  );
};

// ── User card ─────────────────────────────────────────────────────────────────
const UserCard: React.FC<{
  item: UserResult;
  onPress: () => void;
}> = ({ item, onPress }) => {

  return (
    <TouchableOpacity style={styles.userCard} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.userAvatar}>
        {item.profileImageUrl ? (
          <Image source={{ uri: item.profileImageUrl }} style={styles.userAvatarImg} />
        ) : (
          <View style={styles.userAvatarPlaceholder}>
            <Text style={styles.userAvatarEmoji}>👤</Text>
          </View>
        )}
      </View>

      <View style={styles.userInfo}>
        <View style={styles.userTopRow}>
          <Text style={styles.userUsername} numberOfLines={1}>
            @{item.username}
          </Text>
          {item.isFollowedByMe && (
            <View style={styles.followingBadge}>
              <Text style={styles.followingBadgeText}>Following</Text>
            </View>
          )}
        </View>
        {item.fullName.length > 0 && (
          <Text style={styles.userFullName} numberOfLines={1}>{item.fullName}</Text>
        )}
        <Text style={styles.userStats}>
          🎬 {item.moviesWatched}  ·  📺 {item.seriesWatched}
        </Text>
      </View>

      <Text style={styles.userChevron}>›</Text>
    </TouchableOpacity>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  tab,
  isLoading,
  mediaResults,
  castResults,
  userResults,
  query,
  navigation,
}) => {

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.pink} />
        <Text style={styles.loadingText}>Searching…</Text>
      </View>
    );
  }

  const showMedia = tab === 'all' || tab === 'media';
  const showCast  = tab === 'all' || tab === 'cast';
  const showUsers = tab === 'all' || tab === 'users';

  const hasMedia = mediaResults.length > 0;
  const hasCast  = castResults.length > 0;
  const hasUsers = userResults.length > 0;
  const hasAny   = hasMedia || hasCast || hasUsers;

  if (!hasAny) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={styles.emptyTitle}>No results for "{query}"</Text>
        <Text style={styles.emptySubtitle}>Try a different spelling or keyword</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={[]}
      renderItem={null}
      ListHeaderComponent={
        <>
          {showMedia && hasMedia && (
            <View>

              {tab === 'all' && (
                <Text style={styles.sectionTitle}>
                  🎬 Movies & Series
                  <Text style={styles.sectionCount}> {mediaResults.length}</Text>
                </Text>
              )}

              <FlatList
                data={mediaResults}
                keyExtractor={item => `media-${item.id}`}
                numColumns={COLS}
                renderItem={({ item, index }) => (
                  <MediaCard
                    item={item}
                    index={index}
                    onPress={() => {
                      if (navigation && item.mediaType === 'movie') {
                        navigation.navigate('Movie', { movieId: item.id });
                      } else {
                        navigation.navigate('Series', { seriesId: item.id });
                      }
                    }}
                  />
                )}
                columnWrapperStyle={styles.row}
                scrollEnabled={false}
                contentContainerStyle={styles.grid}
              />

            </View>
          )}

          {showCast && hasCast && (
            <View style={showMedia && hasMedia ? styles.nextSection : undefined}>

              {tab === 'all' && (
                <Text style={styles.sectionTitle}>
                  🎭 Cast & Crew
                  <Text style={styles.sectionCount}> {castResults.length}</Text>
                </Text>
              )}

              <FlatList
                data={castResults}
                keyExtractor={item => `cast-${item.id}`}
                numColumns={COLS}
                renderItem={({ item, index }) => (
                  <CastCard
                    item={item}
                    index={index}
                    onPress={() => {
                      if (navigation) {
                        navigation.navigate('Person', {
                          personId: item.id,
                          personName: item.name,
                        });
                      }
                    }}
                  />
                )}
                columnWrapperStyle={styles.row}
                scrollEnabled={false}
                contentContainerStyle={styles.grid}
              />

            </View>
          )}

          {showUsers && hasUsers && (
            <View style={(showMedia && hasMedia) || (showCast && hasCast) ? styles.nextSection : undefined}>

              {tab === 'all' && (
                <Text style={styles.sectionTitle}>
                  👥 Users
                  <Text style={styles.sectionCount}> {userResults.length}</Text>
                </Text>
              )}

              <View style={styles.usersList}>
                {userResults.map(item => (
                  <UserCard
                    key={`user-${item.id}`}
                    item={item}
                    onPress={() => {
                      if (navigation) {
                        navigation.navigate('UserProfile', { userId: item.id });
                      }
                    }}
                  />
                ))}
              </View>

            </View>
          )}

          <View style={{ height: 80 }} />
        </>
      }
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    />
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 8,
  },

  loadingText: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },

  emptyEmoji: { fontSize: 40, marginBottom: 8 },

  emptyTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
  },

  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
  },

  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.white,
    paddingHorizontal: SIDE_PAD,
    paddingTop: 16,
    paddingBottom: 12,
  },

  sectionCount: {
    fontFamily: FONTS.regular,
    color: COLORS.gray,
    fontSize: 13,
  },

  nextSection: { marginTop: 8 },

  grid: { paddingHorizontal: SIDE_PAD },
  row: { marginBottom: CARD_GAP },

  mediaCard: { width: CARD_W },

  mediaPoster: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: COLORS.cardBg,
    marginBottom: 6,
  },

  castPoster: { borderRadius: 10 },

  posterImg: { width: '100%', height: '100%' },

  posterPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardDark,
  },

  ratingBadge: {
    position: 'absolute',
    bottom: 6,
    left: 5,
    backgroundColor: 'rgba(0,0,0,0.78)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },

  ratingText: {
    fontFamily: FONTS.medium,
    fontSize: 9,
    color: COLORS.gold,
  },

  typeBadge: {
    position: 'absolute',
    top: 6,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 5,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },

  typeText: {
    fontFamily: FONTS.medium,
    fontSize: 8,
    color: COLORS.gray,
  },

  roleBadge: {
    position: 'absolute',
    bottom: 6,
    left: 5,
    backgroundColor: 'rgba(255,175,204,0.85)',
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 5,
  },

  roleText: {
    fontFamily: FONTS.medium,
    fontSize: 9,
    color: COLORS.background,
  },

  mediaTitle: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.white,
    lineHeight: 15,
  },

  mediaYear: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: COLORS.cardTextLight,
    marginTop: 2,
  },

  // ── User card styles ────────────────────────────────────────────────────────
  usersList: {
    paddingHorizontal: SIDE_PAD,
  },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    marginBottom: 8,
    gap: 12,
  },

  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.gold,
  },

  userAvatarImg: { width: '100%', height: '100%' },

  userAvatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardDark,
  },

  userAvatarEmoji: { fontSize: 22 },

  userInfo: { flex: 1, gap: 2 },

  userTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  userUsername: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.pink,
    flexShrink: 1,
  },

  followingBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },

  followingBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 9,
    color: COLORS.gold,
  },

  userFullName: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.white,
  },

  userStats: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.cardTextLight,
  },

  userChevron: {
    fontSize: 24,
    color: COLORS.cardTextLight,
    paddingHorizontal: 4,
  },
});