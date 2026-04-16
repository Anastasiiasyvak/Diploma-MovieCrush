import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Image, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { TMDB_IMAGE_BASE } from '../../constants/tmdb';
import { MovieCastMember } from '../../types/movie.types';

interface Props {
  cast: MovieCastMember[];
  votedActorId: number | null;
  onVote: (actorId: number, actorName: string) => void;
  loading?: boolean;
}

export const BestActorPicker: React.FC<Props> = ({
  cast, votedActorId, onVote, loading = false,
}) => {
  const top = cast.slice(0, 10);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Best Performance</Text>
      <Text style={styles.subtitle}>Who stood out the most?</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.gold} style={{ marginTop: 8 }} />
      ) : (
        <FlatList
          data={top}
          keyExtractor={item => String(item.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isVoted  = votedActorId === item.id;
            const photoUrl = item.profile_path
              ? `${TMDB_IMAGE_BASE}/w185${item.profile_path}`
              : null;

            return (
              <TouchableOpacity
                style={[styles.card, isVoted && styles.cardActive]}
                onPress={() => onVote(item.id, item.name)}
                activeOpacity={0.8}
              >
                <View style={[styles.avatarWrap, isVoted && styles.avatarActive]}>
                  {photoUrl ? (
                    <Image source={{ uri: photoUrl }} style={styles.avatar} resizeMode="cover" />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={{ fontSize: 22 }}>🎭</Text>
                    </View>
                  )}
                  {isVoted && (
                    <View style={styles.votedBadge}>
                      <Text style={styles.votedIcon}>🏆</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.name, isVoted && styles.nameActive]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.character} numberOfLines={1}>{item.character}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const AVATAR = 68;

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.white,
    paddingHorizontal: 16,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.gray,
    paddingHorizontal: 16,
  },
  list: { paddingHorizontal: 16, gap: 14 },

  card: {
    alignItems: 'center',
    gap: 5,
    width: AVATAR + 12,
  },
  cardActive: {},

  avatarWrap: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    overflow: 'hidden',
    backgroundColor: COLORS.cardDark,
    borderWidth: 2,
    borderColor: COLORS.cardDark,
    position: 'relative',
  },
  avatarActive: { borderColor: COLORS.gold },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  votedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  votedIcon: { fontSize: 13 },

  name: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.white,
    textAlign: 'center',
    lineHeight: 14,
  },
  nameActive: { color: COLORS.gold },
  character: {
    fontFamily: FONTS.regular,
    fontSize: 9,
    color: COLORS.cardTextLight,
    textAlign: 'center',
  },
});