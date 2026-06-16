import React from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { POSTER_SIZES } from '../../constants/tmdb';
import { styles, COLS, CARD_GAP } from './SearchResultsView.styles';
import { SearchTab } from './SearchBar';
import { MediaType } from '../../types/tmdb.types';

export interface MediaResult {
  id: number;
  mediaType: MediaType;
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