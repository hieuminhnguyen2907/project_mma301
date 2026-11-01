import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFavorites, toggleProductFavorite } from '../../store/slices/productSlice';
import { Header } from '../../components/common/Header';
import { ProductCard } from '../../components/product/ProductCard';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, spacing, typography, borderRadius } from '../../config/theme';
import { ROUTES } from '../../constants/routes';

export const FavoritesScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { favorites = [] } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchFavorites(user ? user.uid : 'guest_device'));
  }, [user?.uid, dispatch]);

  const handleToggleFavorite = (product) => {
    dispatch(
      toggleProductFavorite({
        userId: user ? user.uid : 'guest_device',
        productId: product.id,
      })
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Sản phẩm yêu thích" showBack={false} />

      {/* Guest Storage Notice Banner */}
      {!user && favorites.length > 0 && (
        <View style={styles.guestNoticeBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#0284C7" />
          <Text style={styles.guestNoticeText} numberOfLines={2}>
            Danh sách yêu thích đang được lưu trên máy của bạn.
          </Text>
          <TouchableOpacity
            style={styles.guestLoginBtn}
            onPress={() => navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN })}
          >
            <Text style={styles.guestLoginBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      )}

      {favorites.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Chưa có sản phẩm yêu thích"
          subtitle="Hãy bấm vào biểu tượng trái tim ở các món đồ cũ bạn ưng ý để lưu lại xem sau."
          actionTitle="Khám phá đồ cũ ngay"
          onActionPress={() => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_EXPLORE })}
        />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.gridItemWrapper}>
              <ProductCard
                product={item}
                isFavorite={true}
                onPress={() =>
                  navigation.navigate(ROUTES.PRODUCT_DETAIL, { productId: item.id })
                }
                onFavoritePress={handleToggleFavorite}
              />
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  guestNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
  },
  guestNoticeText: {
    ...typography.caption,
    color: '#0369A1',
    flex: 1,
    marginLeft: 6,
    fontSize: 11,
  },
  guestLoginBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
    marginLeft: 6,
  },
  guestLoginBtnText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 11,
  },
  listContent: {
    padding: 6,
    paddingBottom: 100,
  },
  gridItemWrapper: {
    width: '50%',
    padding: 6,
  },
});
