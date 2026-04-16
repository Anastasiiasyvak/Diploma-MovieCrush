import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';

interface Props {
  value: number | null;    // 1–10 або null
  onChange: (val: number | null) => void;
  size?: number;
  readonly?: boolean;
}

const Star: React.FC<{
  index: number;       
  value: number | null;
  size: number;
  onPress?: (i: number) => void;
}> = ({ index, value, size, onPress }) => {
  const filled = value !== null && index <= value;

  const starPath = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

  return (
    <TouchableOpacity
      onPress={() => onPress?.(index)}
      activeOpacity={onPress ? 0.7 : 1}
      style={{ padding: 2 }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d={starPath}
          fill={filled ? COLORS.gold : 'none'}
          stroke={filled ? COLORS.gold : '#444'}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </Svg>
    </TouchableOpacity>
  );
};

export const StarRating: React.FC<Props> = ({
  value, onChange, size = 26, readonly = false,
}) => {
  const handlePress = (i: number) => {
    if (readonly) return;
    if (value === i) {
      onChange(null);
    } else {
      onChange(i);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.stars}>
        {[1,2,3,4,5,6,7,8,9,10].map(i => (
          <Star
            key={i}
            index={i}
            value={value}
            size={size}
            onPress={readonly ? undefined : handlePress}
          />
        ))}
      </View>
      <Text style={styles.label}>
        {value !== null ? `${value} / 10` : 'Tap to rate'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 8 },
  stars: { flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.gold,
  },
});