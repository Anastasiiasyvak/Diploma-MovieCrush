import React, { useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

export type SearchTab = 'all' | 'media' | 'cast' | 'users';

interface SearchBarProps {
  query: string;
  activeTab: SearchTab;
  isActive: boolean;
  onChangeText: (text: string) => void;
  onTabChange: (tab: SearchTab) => void;
  onActivate: () => void;
  onCancel: () => void;
  onClear: () => void;
}

const TABS: { key: SearchTab; label: string; emoji: string }[] = [
  { key: 'all',   label: 'All',   emoji: '🔍' },
  { key: 'media', label: 'Media', emoji: '🎬' },
  { key: 'cast',  label: 'Cast',  emoji: '🎭' },
  { key: 'users', label: 'Users', emoji: '👥' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  query, activeTab, isActive,
  onChangeText, onTabChange,
  onActivate, onCancel, onClear,
}) => {
  const inputRef = useRef<TextInput>(null);

  const handleActivate = () => {
    onActivate();
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  return (
    <View style={styles.wrapper}>
      {/* ── Input row ── */}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={[styles.inputWrap, isActive && styles.inputWrapActive]}
          activeOpacity={isActive ? 1 : 0.7}
          onPress={!isActive ? handleActivate : undefined}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Movies, series, cast…"
            placeholderTextColor={COLORS.gray}
            value={query}
            onChangeText={onChangeText}
            onFocus={onActivate}
            returnKeyType="search"
            editable={isActive}
          />
          {query.length > 0 && isActive && (
            <TouchableOpacity onPress={onClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {isActive && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tabs ── */}
      {isActive && (
        <View style={styles.tabs}>
          {TABS.map(tab => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => onTabChange(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.emoji} {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 8,
    zIndex: 100,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  inputWrapActive: {
    borderColor: COLORS.pink,
  },
  searchIcon: { fontSize: 14 },
  input: {
    flex: 1,
    fontFamily: FONTS.regular,
    fontSize: 14,
    color: COLORS.white,
    padding: 0,
  },
  clearIcon: { fontSize: 14, color: COLORS.gray, paddingHorizontal: 2 },
  cancelBtn: { paddingVertical: 4, paddingHorizontal: 2 },
  cancelText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.pink },

  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    borderWidth: 0.5,
    borderColor: '#2a2a2a',
  },
  tabActive: {
    backgroundColor: 'rgba(255,175,204,0.15)',
    borderColor: COLORS.pink,
  },
  tabText:       { fontFamily: FONTS.regular,  fontSize: 12, color: COLORS.gray },
  tabTextActive: { fontFamily: FONTS.medium,   fontSize: 12, color: COLORS.pink },
});