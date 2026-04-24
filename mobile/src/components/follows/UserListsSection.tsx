// src/components/follows/UserListsSection.tsx
//
// Блок "Lists" на UserProfileScreen. Показує 3 default (watched/favorites/watchlist)
// + публічні custom-списки. Для кожного — назву, кількість елементів і emoji-іконку.
// Клік поки не робимо — в наступному підкроку додамо перехід на список.

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { StyleSheet } from 'react-native';
import { followsService, PublicListSummary } from '../../services/followsService';

interface Props {
  userId: number;
  onListPress?: (list: PublicListSummary) => void;
}

const iconFor = (type: PublicListSummary['list_type']): string => {
  if (type === 'watched')   return '✅';
  if (type === 'favorites') return '❤️';
  if (type === 'watchlist') return '🔖';
  return '📁';
};

const labelFor = (list: PublicListSummary): string => {
  if (list.list_type === 'watched')   return 'Watched';
  if (list.list_type === 'favorites') return 'Favorites';
  if (list.list_type === 'watchlist') return 'Watchlist';
  return list.name;
};

export const UserListsSection: React.FC<Props> = ({ userId, onListPress }) => {
  const [lists, setLists] = useState<PublicListSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    followsService.getUserLists(userId)
      .then(setLists)
      .catch(err => {
        console.error('UserListsSection load error:', err);
        setLists([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="small" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Lists</Text>
      <View style={styles.grid}>
        {lists.map(list => (
          <TouchableOpacity
            key={list.id}
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => onListPress?.(list)}
          >
            <Text style={styles.icon}>{iconFor(list.list_type)}</Text>
            <Text style={styles.name} numberOfLines={1}>{labelFor(list)}</Text>
            <Text style={styles.count}>{list.items_count} items</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, marginBottom: 16 },

  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.white,
    marginBottom: 10,
  },

  loader: { paddingVertical: 24, alignItems: 'center' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    width: '48.5%',
    gap: 4,
  },

  icon: { fontSize: 22 },

  name: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.white,
  },

  count: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.cardTextLight,
  },
});