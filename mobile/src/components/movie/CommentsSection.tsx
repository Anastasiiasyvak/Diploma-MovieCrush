import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image, Switch,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { TMDB_IMAGE_BASE } from '../../constants/tmdb';
import { MovieComment } from '../../types/movie.types';
import { movieService } from '../../services/movieService';
import { CustomAlert } from '../ui/CustomAlert';


const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};


interface CardProps {
  item: MovieComment;
  currentUserId?: number;
  onReact: (id: number, isLike: boolean) => void;
  onEdit: (item: MovieComment) => void;
  onDeletePress: (id: number) => void;  
}

const CommentCard: React.FC<CardProps> = ({
  item, currentUserId, onReact, onEdit, onDeletePress,
}) => {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);

  const isOwner = currentUserId !== undefined
    && currentUserId === item.user_id
    && !item.is_anonymous;

  const avatarUrl = item.profile_image_url
    ? `${TMDB_IMAGE_BASE}/w185${item.profile_image_url}`
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarEmoji}>
                {item.is_anonymous ? '👤' : '🎭'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardMeta}>
          <Text style={styles.username}>
            {item.is_anonymous ? 'Anonymous' : (item.username ?? 'User')}
            {item.is_edited && (
              <Text style={styles.editedBadge}> · edited</Text>
            )}
          </Text>
          <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
        </View>

        <View style={styles.cardActions}>
          {item.has_spoiler && (
            <View style={styles.spoilerBadge}>
              <Text style={styles.spoilerBadgeText}>⚠️</Text>
            </View>
          )}
          {isOwner && (
            <>
              <TouchableOpacity
                onPress={() => onEdit(item)}
                style={styles.actionBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDeletePress(item.id)}
                style={styles.actionBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.actionBtnText, { color: COLORS.error }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {item.has_spoiler && !spoilerRevealed ? (
        <TouchableOpacity
          style={styles.spoilerBlur}
          onPress={() => setSpoilerRevealed(true)}
          activeOpacity={0.9}
        >
          <Text style={styles.spoilerBlurText}>🫣  Tap to reveal spoiler</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.commentText}>{item.comment_text}</Text>
      )}

      <View style={styles.reactRow}>
        <TouchableOpacity
          style={[styles.reactBtn, item.my_reaction === 'like' && styles.reactBtnActive]}
          onPress={() => onReact(item.id, true)}
          activeOpacity={0.7}
        >
          <Text style={styles.reactIcon}>👍</Text>
          <Text style={[styles.reactCount, item.my_reaction === 'like' && styles.reactCountActive]}>
            {item.likes_count}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reactBtn, item.my_reaction === 'dislike' && styles.reactBtnActive]}
          onPress={() => onReact(item.id, false)}
          activeOpacity={0.7}
        >
          <Text style={styles.reactIcon}>👎</Text>
          <Text style={[styles.reactCount, item.my_reaction === 'dislike' && styles.reactCountActive]}>
            {item.dislikes_count}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


interface Props {
  tmdbId: number;
  currentUserId?: number;
}

export const CommentsSection: React.FC<Props> = ({ tmdbId, currentUserId }) => {
  const [comments, setComments] = useState<MovieComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [text, setText] = useState('');
  const [isAnonymous, setAnonymous] = useState(false);
  const [hasSpoiler, setSpoiler] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    visible: boolean;
    commentId: number | null;
  }>({ visible: false, commentId: null });

  useEffect(() => { load(); }, [tmdbId]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await movieService.getComments(tmdbId);
      setComments(data);
    } catch (e) {
      console.error('load comments error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    try {
      const comment = await movieService.postComment(
        tmdbId, text.trim(), isAnonymous, hasSpoiler
      );
      setComments(prev => [comment, ...prev]);
      setText('');
      setAnonymous(false);
      setSpoiler(false);
    } catch (e) {
      console.error('post comment error:', e);
    } finally {
      setPosting(false);
    }
  };

  const handleReact = async (commentId: number, isLike: boolean) => {
    try {
      const data = await movieService.reactToComment(commentId, isLike);
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? { ...c, likes_count: data.likes_count, dislikes_count: data.dislikes_count, my_reaction: data.my_reaction }
            : c
        )
      );
    } catch (e) {
      console.error('react error:', e);
    }
  };

  const startEdit = (item: MovieComment) => {
    setEditingId(item.id);
    setEditText(item.comment_text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    setEditSaving(true);
    try {
      const updated = await movieService.editComment(editingId, editText.trim());
      setComments(prev => prev.map(c => c.id === editingId ? updated : c));
      cancelEdit();
    } catch (e) {
      console.error('edit comment error:', e);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeletePress = (commentId: number) => {
    setDeleteConfirm({ visible: true, commentId });
  };

  const confirmDelete = async () => {
    const { commentId } = deleteConfirm;
    setDeleteConfirm({ visible: false, commentId: null });
    if (commentId === null) return;
    try {
      await movieService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (e) {
      console.error('delete comment error:', e);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>
        Comments <Text style={styles.count}>{comments.length}</Text>
      </Text>

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment…"
          placeholderTextColor={COLORS.gray}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={500}
        />
        <Text style={styles.charCount}>{text.length}/500</Text>
        <View style={styles.toggleRow}>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>Anonymous</Text>
            <Switch
              value={isAnonymous}
              onValueChange={setAnonymous}
              trackColor={{ false: COLORS.cardDark, true: COLORS.gold }}
              thumbColor={COLORS.white}
            />
          </View>
          <View style={styles.toggleItem}>
            <Text style={styles.toggleLabel}>⚠️ Spoiler</Text>
            <Switch
              value={hasSpoiler}
              onValueChange={setSpoiler}
              trackColor={{ false: COLORS.cardDark, true: '#ff6b35' }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>
        <TouchableOpacity
          style={[styles.postBtn, (!text.trim() || posting) && styles.postBtnDisabled]}
          onPress={handlePost}
          disabled={!text.trim() || posting}
          activeOpacity={0.8}
        >
          {posting
            ? <ActivityIndicator size="small" color={COLORS.background} />
            : <Text style={styles.postBtnText}>Post</Text>
          }
        </TouchableOpacity>
      </View>

      {editingId !== null && (
        <View style={styles.editWrap}>
          <Text style={styles.editTitle}>Edit comment</Text>
          <TextInput
            style={styles.input}
            value={editText}
            onChangeText={setEditText}
            multiline
            maxLength={500}
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={cancelEdit}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.postBtn,
                { flex: 1 },
                (!editText.trim() || editSaving) && styles.postBtnDisabled,
              ]}
              onPress={saveEdit}
              disabled={!editText.trim() || editSaving}
              activeOpacity={0.8}
            >
              {editSaving
                ? <ActivityIndicator size="small" color={COLORS.background} />
                : <Text style={styles.postBtnText}>Save</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="small" color={COLORS.gold} />
        </View>
      ) : comments.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>No comments yet. Be the first!</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {comments.map(item => (
            <CommentCard
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              onReact={handleReact}
              onEdit={startEdit}
              onDeletePress={handleDeletePress}
            />
          ))}
        </View>
      )}

      <CustomAlert
        visible={deleteConfirm.visible}
        title="Delete comment?"
        message="This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ visible: false, commentId: null })}
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="danger"
      />
    </View>
  );
};


const styles = StyleSheet.create({
  wrap: { gap: 14 },
  sectionTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.white,
    paddingHorizontal: 16,
  },
  count: { fontFamily: FONTS.regular, color: COLORS.gray, fontSize: 13 },

  inputWrap: {
    marginHorizontal: 16,
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: '#222',
    padding: 14,
    gap: 10,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.white,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: COLORS.cardTextLight,
    textAlign: 'right',
  },
  toggleRow: { flexDirection: 'row', gap: 16 },
  toggleItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleLabel: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.gray },

  postBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.background,
  },

  editWrap: {
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: 14,
    gap: 10,
  },
  editTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.gold },
  editActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  cancelBtnText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.gray },

  loader: { alignItems: 'center', paddingVertical: 20 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyIcon: { fontSize: 32 },
  emptyText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.cardTextLight },

  list: { gap: 8 },

  card: {
    backgroundColor: COLORS.cardBg,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 0.5,
    borderColor: '#1a1a1a',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarWrap: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden', flexShrink: 0 },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: COLORS.cardDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 16 },
  cardMeta: { flex: 1 },
  username: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.white },
  editedBadge: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.cardTextLight },
  time: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.cardTextLight },

  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spoilerBadge: {
    backgroundColor: 'rgba(255,107,53,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  spoilerBadgeText: { fontSize: 12 },
  actionBtn: { paddingHorizontal: 6, paddingVertical: 3 },
  actionBtnText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.gray },

  spoilerBlur: {
    backgroundColor: 'rgba(255,107,53,0.08)',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255,107,53,0.3)',
    paddingVertical: 16,
    alignItems: 'center',
  },
  spoilerBlurText: { fontFamily: FONTS.medium, fontSize: 13, color: '#ff6b35' },
  commentText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#cccccc',
    lineHeight: 20,
  },

  reactRow: { flexDirection: 'row', gap: 10 },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: COLORS.cardDark,
  },
  reactBtnActive: { backgroundColor: 'rgba(255,215,0,0.12)' },
  reactIcon: { fontSize: 13 },
  reactCount: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.gray },
  reactCountActive: { color: COLORS.gold },
});