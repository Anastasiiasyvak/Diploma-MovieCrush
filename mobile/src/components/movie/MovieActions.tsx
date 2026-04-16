import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { MovieActions, UserList } from '../../types/movie.types';
import { movieService } from '../../services/movieService';

const HeartIcon: React.FC<{ filled: boolean; size?: number }> = ({ filled, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      stroke={filled ? COLORS.pink : '#555'}
      strokeWidth={1.8}
      fill={filled ? COLORS.pink : 'none'}
    />
  </Svg>
);

const BookmarkIcon: React.FC<{ filled: boolean; size?: number }> = ({ filled, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
      stroke={filled ? COLORS.gold : '#555'}
      strokeWidth={1.8}
      fill={filled ? COLORS.gold : 'none'}
    />
  </Svg>
);

const ThumbDownIcon: React.FC<{ filled: boolean; size?: number }> = ({ filled, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z"
      stroke={filled ? COLORS.pink : '#555'}
      strokeWidth={1.8}
      fill={filled ? COLORS.pink : 'none'}
    />
    <Path
      d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"
      stroke={filled ? COLORS.pink : '#555'}
      strokeWidth={1.8}
    />
  </Svg>
);

const ListIcon: React.FC<{ active: boolean; size?: number }> = ({ active, size = 26 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="5" width="18" height="2" rx="1" fill={active ? COLORS.gold : '#555'} />
    <Rect x="3" y="11" width="18" height="2" rx="1" fill={active ? COLORS.gold : '#555'} />
    <Rect x="3" y="17" width="12" height="2" rx="1" fill={active ? COLORS.gold : '#555'} />
    <Path
      d="M18 15l2 2 4-4"
      stroke={active ? COLORS.gold : 'transparent'}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);


interface Props {
  tmdbId: number;
  mediaType?: 'movie' | 'tv';
  actions: MovieActions;
  lists: UserList[];
  onActionsChange: (actions: MovieActions) => void;
}


export const MovieActionsBar: React.FC<Props> = ({
  tmdbId, mediaType = 'movie', actions, lists, onActionsChange,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [listModal, setListModal] = useState(false);
  const [listLoading, setListLoading] = useState<number | null>(null);

  const [addedToLists, setAddedToLists] = useState<Set<number>>(new Set());
  const [listsChecked, setListsChecked] = useState(false);

  const customLists = lists.filter(l => l.list_type === 'custom');
  const hasAnyListAdded = addedToLists.size > 0;

  // Завантажу стан при відкритті модалки і lazy - тільки коли потрібно
  const checkLists = async () => {
    if (customLists.length === 0) return;
    const added = new Set<number>();
    await Promise.allSettled(
      customLists.map(async l => {
        try {
          const items = await movieService.getListItems(l.id);
          if (items.some(i => i.tmdb_id === tmdbId)) {
            added.add(l.id);
          }
        } catch {}
      })
    );
    setAddedToLists(added);
    setListsChecked(true);
  };

  const handleOpenModal = async () => {
    setListModal(true);
    if (!listsChecked) {
      await checkLists();
    }
  };

  const toggle = async (action: 'favorite' | 'watchlist' | 'watched' | 'dislike') => {
    setLoading(action);
    try {
      const updated = await movieService.toggleAction(tmdbId, action, mediaType);
      onActionsChange(updated);
    } catch (e) {
      console.error('toggleAction error:', e);
    } finally {
      setLoading(null);
    }
  };

  const handleListToggle = async (listId: number) => {
    setListLoading(listId);
    try {
      if (addedToLists.has(listId)) {
        await movieService.removeFromList(listId, tmdbId);
        setAddedToLists(prev => {
          const s = new Set(prev);
          s.delete(listId);
          return s;
        });
      } else {
        await movieService.addToList(listId, tmdbId, 'movie');
        setAddedToLists(prev => new Set(prev).add(listId));
      }
    } catch (e) {
      console.error('list toggle error:', e);
    } finally {
      setListLoading(null);
    }
  };

  return (
    <>
      <View style={styles.row}>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => toggle('favorite')}
          activeOpacity={0.7}
          disabled={loading === 'favorite'}
        >
          {loading === 'favorite'
            ? <ActivityIndicator size="small" color={COLORS.pink} />
            : <HeartIcon filled={actions.is_favorite} />
          }
          <Text style={[styles.iconLabel, actions.is_favorite && styles.iconLabelPink]}>
            Favorite
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => toggle('watchlist')}
          activeOpacity={0.7}
          disabled={loading === 'watchlist'}
        >
          {loading === 'watchlist'
            ? <ActivityIndicator size="small" color={COLORS.gold} />
            : <BookmarkIcon filled={actions.is_watchlist} />
          }
          <Text style={[styles.iconLabel, actions.is_watchlist && styles.iconLabelGold]}>
            Watchlist
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.watchBtn, actions.is_watched && styles.watchBtnActive]}
          onPress={() => toggle('watched')}
          activeOpacity={0.7}
          disabled={loading === 'watched'}
        >
          {loading === 'watched'
            ? <ActivityIndicator size="small" color={actions.is_watched ? COLORS.background : COLORS.white} />
            : <Text style={[styles.watchBtnText, actions.is_watched && styles.watchBtnTextActive]}>
                {actions.is_watched ? 'Watched' : 'Watch'}
              </Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => toggle('dislike')}
          activeOpacity={0.7}
          disabled={loading === 'dislike'}
        >
          {loading === 'dislike'
            ? <ActivityIndicator size="small" color={COLORS.gray} />
            : <ThumbDownIcon filled={actions.is_disliked} />
          }
          <Text style={[styles.iconLabel, actions.is_disliked && styles.iconLabelPink]}>
            Dislike
          </Text>
        </TouchableOpacity>

        {customLists.length > 0 && (
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleOpenModal}
            activeOpacity={0.7}
          >
            <ListIcon active={hasAnyListAdded} />
            <Text style={[styles.iconLabel, hasAnyListAdded && styles.iconLabelGold]}>
              My lists
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Lists modal */}
      <Modal
        visible={listModal}
        transparent
        animationType="fade"
        onRequestClose={() => setListModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setListModal(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>My Lists</Text>
              <TouchableOpacity onPress={() => setListModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {!listsChecked ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator color={COLORS.gold} />
              </View>
            ) : (
              <FlatList
                data={customLists}
                keyExtractor={l => String(l.id)}
                style={{ maxHeight: 320 }}
                renderItem={({ item }) => {
                  const isAdded = addedToLists.has(item.id);
                  const isLoading = listLoading === item.id;

                  return (
                    <TouchableOpacity
                      style={[styles.listItem, isAdded && styles.listItemAdded]}
                      onPress={() => handleListToggle(item.id)}
                      activeOpacity={0.7}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color={COLORS.gold} />
                      ) : (
                        <>
                          <View style={styles.listItemLeft}>
                            {item.is_private && (
                              <Text style={styles.privateBadge}>🔒 </Text>
                            )}
                            <Text style={[
                              styles.listItemName,
                              isAdded && styles.listItemNameAdded,
                            ]}>
                              {item.name}
                            </Text>
                          </View>
                          <View style={[
                            styles.badge,
                            isAdded && styles.badgeAdded,
                          ]}>
                            <Text style={[
                              styles.badgeText,
                              isAdded && styles.badgeTextAdded,
                            ]}>
                              {isAdded ? '✓ Added' : '+ Add'}
                            </Text>
                          </View>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};


const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },

  iconBtn: { alignItems: 'center', gap: 4, minWidth: 52 },
  iconLabel: {
    fontFamily: FONTS.regular,
    fontSize: 10,
    color: '#555',
    textAlign: 'center',
  },
  iconLabelPink: { color: COLORS.pink },
  iconLabelGold: { color: COLORS.gold },

  watchBtn: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#555',
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  watchBtnActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  watchBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: '#aaa',
  },
  watchBtnTextActive: { color: COLORS.background },

  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: '#222',
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.cardDark,
  },
  modalTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.white },
  modalClose: { fontSize: 18, color: COLORS.cardTextLight, paddingHorizontal: 4 },
  modalLoader: { paddingVertical: 32, alignItems: 'center' },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1a1a1a',
  },
  listItemAdded: { backgroundColor: 'rgba(255,215,0,0.05)' },
  listItemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  listItemName: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.white },
  listItemNameAdded: { color: COLORS.gold },
  privateBadge: { fontSize: 12 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  badgeAdded: {
    backgroundColor: 'rgba(255,215,0,0.12)',
    borderColor: COLORS.gold,
  },
  badgeText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.gray,
  },
  badgeTextAdded: { color: COLORS.gold },
});