import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal,
  FlatList, Pressable, ActivityIndicator,
} from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { COLORS } from '../../constants/colors';
import { MovieActions, UserList } from '../../types/movie.types';
import { movieService } from '../../services/movieService';
import { CustomAlert } from '../ui/CustomAlert';
import { MediaType } from '../../types/tmdb.types';
import { styles } from './MovieActions.styles';

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
  mediaType?: MediaType;
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
  const [seriesWatchedPrompt, setSeriesWatchedPrompt] = useState(false);

  const [addedToLists, setAddedToLists] = useState<Set<number>>(new Set());
  const [listsChecked, setListsChecked] = useState(false);

  const customLists = lists.filter(l => l.list_type === 'custom');
  const hasAnyListAdded = addedToLists.size > 0;

  const handleMarkAllEpisodes = async () => {
    setSeriesWatchedPrompt(false);
    setLoading('watched');
    try {
      await movieService.markAllEpisodesWatched(tmdbId);
      const updated = await movieService.getActions(tmdbId);
      onActionsChange(updated);
    } catch (e) {
      console.error('markAllEpisodes error:', e);
    } finally {
      setLoading(null);
    }
  };

  const handleSeriesWatchedOnly = () => {
    setSeriesWatchedPrompt(false);
    toggle('watched');
  };

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
        } catch (err) {
          console.warn(`Failed to check list ${l.id} for movie ${tmdbId}:`, err);
        }
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
          onPress={() => {
            if (mediaType === 'tv' && !actions.is_watched) {
              setSeriesWatchedPrompt(true);
            } else {
              toggle('watched');
            }
          }}
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

      <CustomAlert
        visible={seriesWatchedPrompt}
        title="Mark all episodes?"
        message="Do you want to mark all episodes of this series as watched too?"
        confirmText="Yes, all episodes"
        cancelText="Just the series"
        onConfirm={handleMarkAllEpisodes}
        onCancel={handleSeriesWatchedOnly}
      />
    </>
  );
};