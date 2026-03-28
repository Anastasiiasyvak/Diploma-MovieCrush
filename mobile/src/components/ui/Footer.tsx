import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

const MAX_WIDTH = 480;

const TABS = [
  { key: 'home', icon: '🎬', label: 'Discover' },
  { key: 'recommendations', icon: '🤖', label: 'For You' },
  { key: 'challenges', icon: '🏆', label: 'Challenges' },
] as const;

type TabKey = typeof TABS[number]['key'];

interface FooterProps {
  activeTab: TabKey;
  onTabPress: (tab: TabKey) => void;
}

export const Footer: React.FC<FooterProps> = ({ activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.footerWrapper}>
      <View style={styles.footerCentered}>
        <View style={[styles.footer, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10 }]}>
          {TABS.map(tab => (
            <TouchableOpacity 
              key={tab.key}
              style={styles.tab} 
              onPress={() => onTabPress(tab.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerWrapper: {
    backgroundColor: '#0a0a0a',
    borderTopWidth: 0.5,
    borderTopColor: COLORS.cardDark,
    alignItems: 'center',
  },
  footerCentered: {
    width: '100%',
    maxWidth: MAX_WIDTH,
  },
  footer: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 3,
  },
  tabLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.darkGray,
  },
  tabLabelActive: {
    color: COLORS.gold,
  },
});