import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../config/theme';

export const StarRating = ({
  rating = 5,
  maxStars = 5,
  size = 16,
  showLabel = false,
  interactive = false,
  onRatingChange,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsRow}>
        {[...Array(maxStars)].map((_, i) => {
          const starNumber = i + 1;
          const isFilled = starNumber <= Math.round(rating);

          if (interactive) {
            return (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => onRatingChange && onRatingChange(starNumber)}
                style={{ padding: 2 }}
              >
                <Ionicons
                  name={isFilled ? 'star' : 'star-outline'}
                  size={size}
                  color={isFilled ? colors.accent : colors.textMuted}
                />
              </TouchableOpacity>
            );
          }

          return (
            <Ionicons
              key={i}
              name={isFilled ? 'star' : 'star-outline'}
              size={size}
              color={isFilled ? colors.accent : colors.textMuted}
              style={{ marginRight: 2 }}
            />
          );
        })}
      </View>
      {showLabel && (
        <Text style={styles.labelText}>{Number(rating).toFixed(1)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 6,
  },
});
