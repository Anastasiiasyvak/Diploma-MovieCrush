import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, Pressable, ScrollView, TouchableOpacity,
  Image, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { UserListItem } from '../../services/followsService';
import { styles } from './FollowListModal.styles';

export type FollowListType = 'friends' | 'followers' | 'following';

interface Props {
  visible: boolean;
  type: FollowListType;
  load: () => Promise<UserListItem[]>;
  onClose: () => void;
  onUserPress: (userId: number) => void;
}

const titleFor = (type: FollowListType): string => {
  if (type === 'friends')   return 'Friends';
  if (type === 'followers') return 'Followers';
  return 'Following';
};

const emptyMessageFor = (type: FollowListType): string => {
  if (type === 'friends')   return 'No friends yet';
  if (type === 'followers') return 'No followers yet';
  return 'Not following anyone yet';
};

export const FollowListModal: React.FC<Props> = ({
  visible, type, load, onClose, onUserPress,
}) => {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    load()
      .then(setUsers)
      .catch(err => {
        console.error('FollowListModal load error:', err);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, [visible, load]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>

          <View style={styles.header}>
            <Text style={styles.title}>{titleFor(type)}</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="small" color={COLORS.gold} />
            </View>
          ) : users.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>{emptyMessageFor(type)}</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {users.map((u, i) => {
                const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ');
                const isLast = i === users.length - 1;
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.row, isLast && styles.rowLast]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onClose();
                      onUserPress(u.id);
                    }}
                  >
                    <View style={styles.avatar}>
                      {u.profile_image_url ? (
                        <Image source={{ uri: u.profile_image_url }} style={styles.avatarImg} />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <Text style={styles.avatarEmoji}>👤</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.info}>
                      <View style={styles.topRow}>
                        <Text style={styles.username} numberOfLines={1}>@{u.username}</Text>
                        {u.is_followed_by_me && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>Following</Text>
                          </View>
                        )}
                      </View>
                      {fullName.length > 0 && (
                        <Text style={styles.fullName} numberOfLines={1}>{fullName}</Text>
                      )}
                    </View>

                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
};