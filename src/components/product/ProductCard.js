import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, spacing, typography, shadows } from '../../config/theme';
import { formatCurrency } from '../../utils/currency';
import { ConditionTag } from './ConditionTag';

export const ProductCard = ({
  product,
  onPress,
  onFavoritePress,
  isFavorite = false,
  style,
}) => {
  const isSoldOut = product.status === 'sold_out' || product.stockQuantity <= 0;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={styles.cardTouchable}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.primaryImage }}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Condition Tag on Top-Left */}
          <View style={styles.conditionTagOverlay}>
            <ConditionTag condition={product.condition?.overallRating} />
          </View>

          {/* Sold Out Overlay */}
          {isSoldOut && (
            <View style={styles.soldOutOverlay}>
              <Text style={styles.soldOutText}>ĐÃ BÁN</Text>
            </View>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text numberOfLines={2} style={styles.name}>
            {product.name}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
            {product.originalPrice > 0 && (
              <Text style={styles.originalPrice}>
                {formatCurrency(product.originalPrice)}
              </Text>
            )}
          </View>

          <View style={styles.footerRow}>
            <View style={styles.sellerRating}>
              <Ionicons name="star" size={13} color={colors.accent} />
              <Text style={styles.sellerRatingText}>
                {product.sellerRating ? Number(product.sellerRating).toFixed(1) : 'Mới'}
              </Text>
            </View>
            {(product.location?.city || product.city) && (
              <View style={styles.locationBadgeRow}>
                <Ionicons name="location-outline" size={12} color={colors.primary} />
                <Text numberOfLines={1} style={styles.locationText}>
                  {product.location?.district ? `${product.location.district}, ` : ''}
                  {product.location?.city || product.city || 'TP.HCM'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* Favorite Button on Top-Right - INDEPENDENT TOUCHABLE (NOT NESTED) */}
      {onFavoritePress && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onFavoritePress(product)}
          style={styles.favoriteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? colors.danger : colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative',
    ...shadows.sm,
  },
  cardTouchable: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 150,
    backgroundColor: colors.borderLight,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  conditionTagOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 5,
    ...shadows.sm,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  soldOutText: {
    color: colors.textInverse,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  infoContainer: {
    padding: spacing.md,
  },
  name: {
    ...typography.subtitle,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  price: {
    ...typography.price,
    fontSize: 15,
  },
  originalPrice: {
    ...typography.caption,
    textDecorationLine: 'line-through',
    color: colors.textMuted,
    marginLeft: 6,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerRatingText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 3,
  },
  locationBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 110,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    marginLeft: 2,
    // Lets numberOfLines ellipsize inside the maxWidth row instead of overflowing it
    flexShrink: 1,
  },
});
