import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Entypo from '@expo/vector-icons/Entypo';

interface SettingsRowProps {
  icon: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  showArrow?: boolean;
  isLast?: boolean;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  icon,
  label,
  sub,
  right,
  onPress,
  showArrow = false,
  isLast = false,
}) => {
  const renderIcon = () => {
    if (icon === 'telegram') {
      return <FontAwesome5 name="telegram" size={18} color={COLORS.gray} style={styles.rowIcon} />;
    }
    if (icon === 'instagram') {
      return <Entypo name="instagram" size={18} color={COLORS.gray} style={styles.rowIcon} />;
    }
    if (icon === 'chevron-back') {
      return <Ionicons name="chevron-back" size={24} color={COLORS.gold} />;
    }
    return <Text style={styles.rowIcon}>{icon}</Text>;
  };

  const inner = (
    <>
      {renderIcon()}
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sub ? <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      {right}
      {showArrow && <Text style={styles.rowArrow}>›</Text>}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.row, isLast && styles.rowLast]} onPress={onPress} activeOpacity={0.7}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.row, isLast && styles.rowLast]}>{inner}</View>;
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.cardDark, gap: 10 },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0, color: COLORS.pink },
  rowContent: { flex: 1, minWidth: 0 },
  rowLabel: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.white },
  rowSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.cardTextLight, marginTop: 2 },
  rowArrow: { color: '#333', fontSize: 18, flexShrink: 0 },
});