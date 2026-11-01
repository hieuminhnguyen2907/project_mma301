import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { aiService } from '../../services/aiService';
import { Header } from '../../components/common/Header';
import { ProductCard } from '../../components/product/ProductCard';
import { EmptyState } from '../../components/common/EmptyState';
import { colors, spacing, typography, borderRadius } from '../../config/theme';
import { ROUTES } from '../../constants/routes';
import { prepareImageForAi } from '../../utils/imageData';

export const VisualSearchScreen = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchResults, setSearchResults] = useState(null);

  const sampleImages = [
    {
      label: 'iPhone',
      uri: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
    },
    {
      label: 'Tai nghe',
      uri: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    },
    {
      label: 'Áo khoác',
      uri: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    },
  ];

  const handleCaptureCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền máy ảnh', 'Vui lòng cho phép quyền Camera để chụp ảnh tìm kiếm đồ cũ.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      runVisualSearch(result.assets[0]);
    }
  };

  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cho phép ứng dụng truy cập thư viện ảnh để sử dụng tìm kiếm hình ảnh.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      runVisualSearch(result.assets[0]);
    }
  };

  const handleSelectImageSource = () => {
    Alert.alert(
      'AI Visual Search',
      'Bạn muốn chụp ảnh trực tiếp hay chọn ảnh có sẵn?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: '📸 Chụp ảnh Camera', onPress: handleCaptureCamera },
        { text: '🖼️ Chọn từ Thư viện', onPress: handlePickFromGallery },
      ]
    );
  };

  // photo: { uri, base64?, mimeType?, label? } (label = known name of a sample photo)
  const runVisualSearch = async (photo) => {
    if (isAnalyzing) return;
    setSelectedImage(photo.uri);
    setIsAnalyzing(true);
    setSearchResults(null);

    try {
      const prepared = await prepareImageForAi(photo);
      const data = await aiService.visualSearch({
        uri: photo.uri,
        base64: prepared?.base64,
        mimeType: prepared?.mimeType,
        hint: photo.label || '',
      });
      setSearchResults(data);
    } catch (err) {
      Alert.alert('Không thể tìm bằng hình ảnh', err.message || 'Vui lòng thử lại với ảnh khác.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const searchByKeyword = () => {
    const keyword = searchResults?.detected?.brand || searchResults?.detected?.name || '';
    navigation.navigate(ROUTES.APP_TABS, {
      screen: ROUTES.TAB_EXPLORE,
      params: { initialQuery: keyword.split(' ').slice(0, 3).join(' ') },
    });
  };

  return (
    <View style={styles.container}>
      <Header title="AI Visual Search (Gemini)" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Intro */}
        <View style={styles.introBox}>
          <Text style={styles.introTitle}>Tìm kiếm đồ cũ bằng hình ảnh</Text>
          <Text style={styles.introSubtitle}>
            Tải lên ảnh món đồ bạn thích, Gemini AI sẽ phân tích đặc điểm thị giác và gợi ý các sản phẩm cũ tương đồng trên sàn.
          </Text>
        </View>

        {/* Upload Box */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.uploadArea}
          onPress={handleSelectImageSource}
        >
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.emptyUpload}>
              <View style={styles.cameraCircle}>
                <Ionicons name="camera-outline" size={36} color={colors.primary} />
              </View>
              <Text style={styles.uploadText}>Chạm để Chụp ảnh hoặc Chọn từ thư viện</Text>
              <Text style={styles.uploadSubtext}>Camera trực tiếp • Thư viện ảnh • AI nhận diện</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Or pick a sample image */}
        <View style={styles.samplesSection}>
          <Text style={styles.sampleTitle}>Hoặc thử nhanh với ảnh mẫu:</Text>
          <View style={styles.samplesRow}>
            {sampleImages.map((s, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.sampleItem}
                disabled={isAnalyzing}
                onPress={() => runVisualSearch({ uri: s.uri, label: s.label })}
              >
                <Image source={{ uri: s.uri }} style={styles.sampleThumb} />
                <Text style={styles.sampleLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Analysis Loading State */}
        {isAnalyzing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Gemini AI đang phân tích đường nét, màu sắc và kiểu dáng...</Text>
          </View>
        )}

        {/* Results */}
        {searchResults && (
          <View style={styles.resultsContainer}>
            <View style={styles.attrCard}>
              <View style={styles.attrHeader}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
                <Text style={styles.attrTitle}>
                  {searchResults.detected?.isLiveAi ? 'Gemini AI nhận diện được:' : 'Tìm theo nhãn ảnh mẫu:'}
                </Text>
              </View>
              {searchResults.detected?.isSellableProduct === false ? (
                <Text style={styles.attrText}>
                  {searchResults.detected.photoQualityIssue ||
                    'Ảnh không chứa món đồ có thể mua bán. Hãy chụp rõ sản phẩm trên nền đơn giản.'}
                </Text>
              ) : (
                <>
                  <Text style={styles.attrText}>
                    • Món đồ: <Text style={{ fontWeight: '700' }}>{searchResults.detected?.name || 'Chưa rõ'}</Text>
                  </Text>
                  {Boolean(searchResults.detected?.brand) && (
                    <Text style={styles.attrText}>
                      • Thương hiệu: <Text style={{ fontWeight: '700' }}>{searchResults.detected.brand}</Text>
                    </Text>
                  )}
                  {Boolean(searchResults.detected?.categoryName) && (
                    <Text style={styles.attrText}>
                      • Danh mục: <Text style={{ fontWeight: '700' }}>{searchResults.detected.categoryName}</Text>
                    </Text>
                  )}
                  {searchResults.detected?.isLiveAi && (
                    <Text style={styles.attrText}>
                      • Độ chắc chắn: <Text style={{ fontWeight: '700' }}>{searchResults.detected.confidenceScore}%</Text>
                    </Text>
                  )}
                </>
              )}
            </View>

            {searchResults.matches?.length > 0 ? (
              <>
                <Text style={styles.matchesTitle}>
                  Sản phẩm tương tự trên ReMarket ({searchResults.matches.length})
                </Text>

                <View style={styles.productsGrid}>
                  {searchResults.matches.map((prod) => (
                    <View key={prod.id} style={styles.gridItem}>
                      <ProductCard
                        product={prod}
                        onPress={() =>
                          navigation.navigate(ROUTES.PRODUCT_DETAIL, { productId: prod.id })
                        }
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <EmptyState
                icon="search-outline"
                title="Không tìm thấy món đồ cũ tương tự"
                subtitle="Hiện chưa có tin đăng nào khớp với ảnh này. Hãy thử chụp góc khác hoặc tìm bằng từ khóa rộng hơn."
                actionTitle={searchResults.detected?.isSellableProduct === false ? undefined : 'Tìm bằng từ khóa'}
                onActionPress={searchResults.detected?.isSellableProduct === false ? undefined : searchByKeyword}
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  introBox: {
    marginBottom: spacing.md,
  },
  introTitle: {
    ...typography.h2,
    fontSize: 20,
    color: colors.primary,
  },
  introSubtitle: {
    ...typography.subtitle,
    fontSize: 13,
    marginTop: 4,
  },
  uploadArea: {
    height: 180,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: '#99F6E4',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  emptyUpload: {
    alignItems: 'center',
  },
  cameraCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadText: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  uploadSubtext: {
    ...typography.caption,
    marginTop: 2,
  },
  samplesSection: {
    marginBottom: spacing.lg,
  },
  sampleTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  samplesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sampleItem: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 6,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sampleThumb: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
  },
  sampleLabel: {
    ...typography.caption,
    fontWeight: '600',
  },
  loadingBox: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...typography.subtitle,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  resultsContainer: {
    marginTop: spacing.md,
  },
  attrCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  attrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  attrTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 6,
  },
  attrText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  matchesTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridItem: {
    width: '50%',
    padding: 6,
    marginBottom: spacing.sm,
  },
});
