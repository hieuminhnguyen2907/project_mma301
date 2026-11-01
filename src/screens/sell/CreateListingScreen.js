import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { createNewListing } from '../../store/slices/productSlice';
import { aiService } from '../../services/aiService';
import { Header } from '../../components/common/Header';
import { KeyboardAwareScrollView } from '../../components/common/KeyboardAwareScrollView';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { DynamicConditionForm } from '../../components/forms/DynamicConditionForm';
import { Modal } from '../../components/common/Modal';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import { parseCurrencyInput, formatCurrency, formatNumberInput, formatNumberWithDots } from '../../utils/currency';
import { resolveCoordinates, parseGeocodeAddress } from '../../utils/locationHelper';
import { ROUTES } from '../../constants/routes';
import { prepareImageForAi } from '../../utils/imageData';
import {
  validateFullProductListing,
  validateProductName,
  validatePrice,
  validateOriginalPrice,
  validateStockQuantity,
  validateDescription,
  validateDefectItem,
} from '../../utils/validation';

import { DEFAULT_CATEGORIES } from '../../constants/categories';

export const CreateListingScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { categories: reduxCategories } = useSelector((state) => state.products);
  // Ensure we always have the canonical category list with guaranteed full names
  const categories = reduxCategories && reduxCategories.length >= DEFAULT_CATEGORIES.length
    ? reduxCategories.map((c) => {
        const canonical = DEFAULT_CATEGORIES.find((dc) => dc.id === c.id);
        return canonical ? { ...c, name: canonical.name, icon: canonical.icon || c.icon } : c;
      })
    : DEFAULT_CATEGORIES;
  const { user } = useSelector((state) => state.auth);

  const defaultUserAddr =
    user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];

  const [customCoordinates, setCustomCoordinates] = useState(null);
  const [locatingGps, setLocatingGps] = useState(false);

  const [form, setForm] = useState({
    name: '',
    categoryId: null, // Don't preselect any category before user choice or AI photo detection
    subCategoryId: null,
    customCategoryTag: '',
    description: '',
    price: '',
    originalPrice: '',
    stockQuantity: '1',
    // The seller must pick the overall condition themselves (BUSINESS_RULES 1.1)
    overallCondition: null,
    // Only real data is pre-filled: a placeholder street would be published as the
    // seller's meetup address
    city: defaultUserAddr?.city || user?.city || '',
    district: defaultUserAddr?.district || '',
    ward: defaultUserAddr?.ward || '',
    streetAddress: defaultUserAddr?.streetAddress || defaultUserAddr?.street || '',
  });

  const handleUseProfileAddress = () => {
    setCustomCoordinates(null);
    if (defaultUserAddr) {
      setForm((p) => ({
        ...p,
        city: defaultUserAddr.city || p.city,
        district: defaultUserAddr.district || p.district,
        ward: defaultUserAddr.ward || p.ward,
        streetAddress:
          defaultUserAddr.streetAddress || defaultUserAddr.street || p.streetAddress,
      }));
      Alert.alert(
        '📍 Đã lấy địa chỉ từ Hồ sơ',
        `Đã nạp: ${defaultUserAddr.street || defaultUserAddr.streetAddress}, ${defaultUserAddr.ward}, ${defaultUserAddr.district}, ${defaultUserAddr.city}`
      );
    } else {
      Alert.alert(
        'Thông báo',
        'Hồ sơ của bạn chưa có sổ địa chỉ nào. Bạn có thể tự gõ địa chỉ bên dưới.'
      );
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setLocatingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Quyền truy cập vị trí',
          'Vui lòng cấp quyền vị trí trong cài đặt thiết bị để ReMarket có thể tự động lấy vị trí hiện tại của bạn.'
        );
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!pos || !pos.coords) {
        throw new Error('Không nhận được toạ độ từ thiết bị');
      }

      const { latitude, longitude } = pos.coords;
      const coords = { lat: latitude, lng: longitude };
      setCustomCoordinates(coords);

      let detectedAddress = null;
      try {
        const geoResults = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geoResults && geoResults.length > 0) {
          detectedAddress = parseGeocodeAddress(geoResults[0]);
        }
      } catch (geoErr) {
        console.warn('Reverse geocode warning:', geoErr);
      }

      if (detectedAddress) {
        setForm((prev) => ({
          ...prev,
          city: detectedAddress.city || prev.city,
          district: detectedAddress.district || prev.district,
          ward: detectedAddress.ward || prev.ward,
          streetAddress: detectedAddress.streetAddress || prev.streetAddress,
        }));

        const fullText = [
          detectedAddress.streetAddress,
          detectedAddress.ward,
          detectedAddress.district,
          detectedAddress.city,
        ]
          .filter(Boolean)
          .join(', ');

        Alert.alert(
          '📍 Đã lấy vị trí hiện tại',
          `Toạ độ GPS: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]\nĐịa chỉ: ${fullText}`
        );
      } else {
        Alert.alert(
          '📍 Đã lấy toạ độ GPS',
          `Toạ độ: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]. Bạn có thể kiểm tra và điền thêm số nhà/tên đường bên dưới.`
        );
      }
    } catch (err) {
      console.warn('GPS location error:', err);
      Alert.alert(
        'Không thể lấy vị trí',
        `Không thể lấy toạ độ hiện tại (${err.message || 'Lỗi thiết bị'}). Bạn có thể tự gõ địa chỉ vào các ô bên dưới.`
      );
    } finally {
      setLocatingGps(false);
    }
  };

  const [conditionData, setConditionData] = useState({});
  const [knownDefects, setKnownDefects] = useState([]);
  const [defectInput, setDefectInput] = useState('');
  const [images, setImages] = useState([]);
  const [imagesMeta, setImagesMeta] = useState([]); // Array of { uri, base64, mimeType }
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [defectError, setDefectError] = useState('');

  // AI Vision Assistant State
  const [aiVisionLoading, setAiVisionLoading] = useState(false);
  const [aiVisionResult, setAiVisionResult] = useState(null);
  const [showAiResultModal, setShowAiResultModal] = useState(false);

  // The Sell tab stays mounted across sign-in/out, so the initial state may have been
  // built for a guest or for the previous account: start a fresh draft for the new one
  const draftOwnerRef = useRef(user?.uid || null);
  useEffect(() => {
    const uid = user?.uid || null;
    if (draftOwnerRef.current === uid) return;
    draftOwnerRef.current = uid;
    setForm({
      name: '',
      categoryId: null,
      subCategoryId: null,
      customCategoryTag: '',
      description: '',
      price: '',
      originalPrice: '',
      stockQuantity: '1',
      overallCondition: null,
      city: defaultUserAddr?.city || user?.city || '',
      district: defaultUserAddr?.district || '',
      ward: defaultUserAddr?.ward || '',
      streetAddress: defaultUserAddr?.streetAddress || defaultUserAddr?.street || '',
    });
    setConditionData({});
    setKnownDefects([]);
    setDefectInput('');
    setImages([]);
    setImagesMeta([]);
    setErrors({});
    setDefectError('');
    setAiVisionResult(null);
    setShowAiResultModal(false);
    setCustomCoordinates(null);
  }, [user?.uid]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Header title="Đăng bán đồ cũ" showBack={false} />
        <View style={styles.centerContainer}>
          <View style={styles.guestPromptBox}>
            <Ionicons name="lock-closed-outline" size={54} color={colors.primary} />
            <Text style={styles.guestTitle}>Cần đăng nhập để đăng bán</Text>
            <Text style={styles.guestSubtitle}>
              Đăng nhập để đăng tải đồ cũ, tiếp cận hàng ngàn người mua và nhận tiền an toàn.
            </Text>
            <Button
              title="Đăng nhập ngay"
              variant="primary"
              size="md"
              onPress={() => navigation.navigate(ROUTES.AUTH_STACK, { screen: ROUTES.LOGIN })}
              style={{ width: '100%', marginTop: spacing.md }}
            />
          </View>
        </View>
      </View>
    );
  }

  const selectedCategoryObj = categories.find((c) => c.id === form.categoryId);

  // Condition answers belong to one category's schema; drop them when it changes
  const handleChangeCategory = (categoryId) => {
    if (categoryId === form.categoryId) return;
    // The seller picks the product type: its questions depend on it (a charger must not
    // be asked about keys just because it shares a category with keyboards)
    setForm((p) => ({ ...p, categoryId, subCategoryId: null }));
    setConditionData({});
    setErrors((prev) => ({ ...prev, categoryId: null, subCategoryId: null }));
  };

  const handleSelectSubCategory = (subCategoryId) => {
    if (subCategoryId === form.subCategoryId) return;
    setForm((p) => ({ ...p, subCategoryId }));
    setConditionData({});
    setErrors((prev) => ({ ...prev, subCategoryId: null }));
  };

  // Real-time single-field change handlers
  const handleNameChange = (text) => {
    setForm((p) => ({ ...p, name: text }));
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: validateProductName(text) }));
    }
  };

  const handlePriceChange = (text) => {
    const formatted = formatNumberInput(text, form.price);
    setForm((p) => ({ ...p, price: formatted }));
    if (errors.price) {
      setErrors((prev) => ({ ...prev, price: validatePrice(formatted) }));
    }
    if (form.originalPrice) {
      setErrors((prev) => ({
        ...prev,
        originalPrice: validateOriginalPrice(form.originalPrice, formatted),
      }));
    }
  };

  const handleOriginalPriceChange = (text) => {
    const formatted = formatNumberInput(text, form.originalPrice);
    setForm((p) => ({ ...p, originalPrice: formatted }));
    if (formatted) {
      setErrors((prev) => ({
        ...prev,
        originalPrice: validateOriginalPrice(formatted, form.price),
      }));
    } else {
      setErrors((prev) => ({ ...prev, originalPrice: null }));
    }
  };

  const handleStockChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '');
    setForm((p) => ({ ...p, stockQuantity: clean }));
    if (errors.stockQuantity) {
      setErrors((prev) => ({ ...prev, stockQuantity: validateStockQuantity(clean) }));
    }
  };

  const handleDescriptionChange = (text) => {
    setForm((p) => ({ ...p, description: text }));
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: validateDescription(text) }));
    }
  };

  const handleConditionChange = (fieldKey, val) => {
    setConditionData((prev) => ({ ...prev, [fieldKey]: val }));
    if (errors[fieldKey]) {
      setErrors((prev) => ({ ...prev, [fieldKey]: null }));
    }
  };

  // Ask user whether they want AI to analyze or fill manually
  const promptAiAnalysisOption = (photoList) => {
    Alert.alert(
      '✨ Tự động điền bằng AI?',
      'Bạn vừa thêm ảnh sản phẩm. Bạn có muốn AI Vision phân tích bức ảnh này để TỰ ĐỘNG ĐIỀN Tên sản phẩm, Danh mục, Tình trạng và Mô tả chi tiết không?',
      [
        {
          text: '✏️ Tôi tự tay điền',
          style: 'cancel',
        },
        {
          text: '🤖 Có, Phân tích bằng AI',
          onPress: () => handleRunAiVision(photoList),
        },
      ]
    );
  };

  // Run AI Vision Analysis with Real Google Gemini
  // photoList: [{ uri, base64, mimeType }] - every photo of the item; several angles let
  // the model read logos/labels and spot defects much more reliably than a single shot
  const handleRunAiVision = async (photoList) => {
    if (!photoList || photoList.length === 0) return;
    setAiVisionLoading(true);
    try {
      const photos = [];
      for (const photo of photoList.slice(0, 3)) {
        const prepared = await prepareImageForAi(photo);
        if (prepared) photos.push(prepared);
      }
      const result = await aiService.analyzeProductImage({
        images: photos,
        // What the seller already typed helps disambiguate the model/edition
        sellerHint: form.name,
      });

      if (result.isSellableProduct === false) {
        Alert.alert(
          'Ảnh chưa phù hợp',
          result.photoQualityIssue ||
            'AI không nhận ra món đồ cần bán trong ảnh. Hãy chụp rõ sản phẩm trên nền đơn giản.'
        );
        return;
      }

      setAiVisionResult({ ...result, analyzedImageUri: photoList[0].uri });
      setShowAiResultModal(true);
    } catch (err) {
      console.warn('AI analysis error:', err);
      Alert.alert(
        'Thông báo AI',
        `Không thể hoàn tất phân tích hình ảnh lúc này (${err.message || 'Lỗi mạng'}). Bạn có thể tự điền các thông tin.`
      );
    } finally {
      setAiVisionLoading(false);
    }
  };

  // Apply AI detected fields to listing form
  const handleApplyAiVisionResult = () => {
    if (!aiVisionResult) return;

    // Only accept a category id the app actually knows (the model may return anything)
    const aiCategoryId = categories.some((c) => c.id === aiVisionResult.categoryId)
      ? aiVisionResult.categoryId
      : null;
    const targetCat = categories.find((c) => c.id === (aiCategoryId || form.categoryId));
    const aiSubCategoryId =
      aiVisionResult.subCategoryId && targetCat?.subCategories?.some((s) => s.id === aiVisionResult.subCategoryId)
        ? aiVisionResult.subCategoryId
        : aiCategoryId && aiCategoryId !== form.categoryId
        ? null // unknown type: let the seller choose instead of guessing the first one
        : form.subCategoryId;
    // Pre-fill the condition checklist with what the AI could see; answers given for
    // another product type are dropped (they belong to a different form)
    const aiConditionData = aiVisionResult.conditionData || {};
    if (aiSubCategoryId !== form.subCategoryId || (aiCategoryId && aiCategoryId !== form.categoryId)) {
      setConditionData(aiConditionData);
    } else {
      setConditionData((prev) => ({ ...prev, ...aiConditionData }));
    }
    setForm((prev) => ({
      ...prev,
      name: aiVisionResult.name || prev.name,
      categoryId: aiCategoryId || prev.categoryId,
      subCategoryId: aiSubCategoryId,
      overallCondition: aiVisionResult.overallCondition || prev.overallCondition,
      description: aiVisionResult.description || prev.description,
      // If user hasn't set price yet, suggest the AI valuation
      price: !prev.price && aiVisionResult.suggestedPrice
        ? formatNumberWithDots(aiVisionResult.suggestedPrice)
        : prev.price,
    }));

    if (aiVisionResult.knownDefects && aiVisionResult.knownDefects.length > 0) {
      setKnownDefects((prev) => {
        const combined = [...prev, ...aiVisionResult.knownDefects];
        return [...new Set(combined)];
      });
    }

    setShowAiResultModal(false);
    Alert.alert(
      '✅ Đã tự động điền xong!',
      'AI đã điền Tên sản phẩm, Danh mục, Độ mới và Mô tả chi tiết. Bạn có thể rà soát lại và điều chỉnh theo ý muốn trước khi xuất bản.'
    );
  };

  // Camera Capture
  const handleCaptureCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền máy ảnh', 'Vui lòng cho phép quyền truy cập máy ảnh (Camera) để chụp ảnh sản phẩm thực tế.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImages((prev) => [...prev, asset.uri].slice(0, 5));
      const meta = { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType };
      setImagesMeta((prev) => [...prev, meta].slice(0, 5));
      setErrors((prev) => ({ ...prev, images: null }));
      promptAiAnalysisOption([...imagesMeta, meta].slice(0, 5));
    }
  };

  // Gallery Picker
  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Vui lòng cấp quyền truy cập thư viện ảnh để tải ảnh lên.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.6,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setImages((prev) => [...prev, asset.uri].slice(0, 5));
      const meta = { uri: asset.uri, base64: asset.base64, mimeType: asset.mimeType };
      setImagesMeta((prev) => [...prev, meta].slice(0, 5));
      setErrors((prev) => ({ ...prev, images: null }));
      promptAiAnalysisOption([...imagesMeta, meta].slice(0, 5));
    }
  };

  const handleOpenImagePicker = () => {
    Alert.alert(
      'Thêm ảnh sản phẩm',
      'Bạn muốn chụp ảnh trực tiếp hay chọn từ thư viện ảnh?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: '📸 Chụp ảnh Camera', onPress: handleCaptureCamera },
        { text: '🖼️ Chọn từ Thư viện', onPress: handlePickFromGallery },
      ]
    );
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagesMeta((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddDefect = () => {
    const err = validateDefectItem(defectInput, knownDefects);
    if (err) {
      setDefectError(err);
      return;
    }
    setKnownDefects((prev) => [...prev, defectInput.trim()]);
    setDefectInput('');
    setDefectError('');
  };

  const handleRemoveDefect = (index) => {
    setKnownDefects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitListing = async () => {
    const activeSubCategory =
      selectedCategoryObj?.subCategories?.find((s) => s.id === form.subCategoryId) || null;
    const hasSubCategories = Boolean(selectedCategoryObj?.subCategories?.length);

    const activeSchema = activeSubCategory
      ? activeSubCategory.conditionFieldSchema
      : hasSubCategories
      ? []
      : selectedCategoryObj?.conditionFieldSchema || [];

    // Run rigorous multi-field validation
    const { isValid, errors: validationErrors, firstError } = validateFullProductListing({
      form,
      images,
      selectedCategory: selectedCategoryObj,
      activeSchema,
      conditionData,
    });

    if (!isValid) {
      setErrors(validationErrors);
      Alert.alert('Chưa đủ thông tin hợp lệ', firstError || 'Vui lòng kiểm tra lại các trường báo đỏ.');
      return;
    }

    setSubmitting(true);
    try {
      const productPayload = {
        name: form.name,
        categoryId: form.categoryId,
        categoryName: selectedCategoryObj?.name || 'Sản phẩm khác',
        subCategoryId: activeSubCategory?.id || null,
        subCategoryName: form.customCategoryTag
          ? `${activeSubCategory?.name || 'Khác'}: ${form.customCategoryTag.trim()}`
          : activeSubCategory?.name || null,
        customCategoryTag: form.customCategoryTag ? form.customCategoryTag.trim() : null,
        description: form.description,
        price: parseCurrencyInput(form.price),
        originalPrice: form.originalPrice ? parseCurrencyInput(form.originalPrice) : null,
        stockQuantity: Number(form.stockQuantity),
        overallCondition: form.overallCondition,
        // Only answers belonging to the chosen product type's form are published
        condition: {
          overallRating: form.overallCondition,
          ...Object.fromEntries(
            activeSchema
              .map((f) => [f.fieldKey, conditionData[f.fieldKey]])
              .filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0))
          ),
        },
        knownDefects,
        images,
        city: form.city,
        location: {
          city: form.city.trim(),
          district: form.district.trim(),
          ward: form.ward.trim(),
          streetAddress: form.streetAddress.trim(),
          fullAddress: [form.streetAddress, form.ward, form.district, form.city]
            .filter(Boolean)
            .join(', '),
          coordinates: customCoordinates || resolveCoordinates(form.city, form.district),
        },
      };

      const newProd = await dispatch(
        createNewListing({ productData: productPayload, seller: user })
      ).unwrap();

      // Clear the form so the Sell tab does not keep (and re-submit) the old listing
      setForm((p) => ({ ...p, name: '', categoryId: null, subCategoryId: null, description: '', price: '', originalPrice: '', stockQuantity: '1', overallCondition: null }));
      setConditionData({});
      setKnownDefects([]);
      setErrors({});
      setDefectError('');
      setImages([]);
      setImagesMeta([]);
      setAiVisionResult(null);
      setCustomCoordinates(null);

      Alert.alert('Thành công', 'Bài đăng đồ cũ của bạn đã được xuất bản trên ReMarket!', [
        {
          text: 'Xem bài đăng',
          onPress: () =>
            navigation.navigate(ROUTES.PRODUCT_DETAIL, { productId: newProd.id }),
        },
        {
          text: 'Về trang chủ',
          onPress: () => navigation.navigate(ROUTES.APP_TABS, { screen: ROUTES.TAB_HOME }),
        },
      ]);
    } catch (err) {
      Alert.alert('Thất bại', String(err?.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Đăng bán đồ cũ" showBack={false} />

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 220 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraScrollHeight={100}
      >
        {/* Image Upload Gallery Box */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Ảnh sản phẩm thực tế (Tối đa 5 ảnh) *</Text>
          <Text style={styles.sectionNote}>
            * Chụp ảnh rõ nét giúp AI nhận diện chính xác và người mua tin tưởng hơn.
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {images.map((uri, index) => (
              <View key={index} style={styles.imageThumbWrapper}>
                <Image source={{ uri }} style={styles.imageThumb} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Ionicons name="close" size={14} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            ))}

            {images.length < 5 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={handleOpenImagePicker}>
                <Ionicons name="camera-outline" size={26} color={colors.primary} />
                <Text style={styles.addImageText}>+ Thêm ảnh</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {errors.images && (
            <View style={styles.imageErrorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.danger} />
              <Text style={styles.imageErrorText}>{errors.images}</Text>
            </View>
          )}

          {/* AI VISION QUICK ACTION BAR */}
          {images.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.aiVisionBanner}
              disabled={aiVisionLoading}
              onPress={() =>
                handleRunAiVision(imagesMeta.length > 0 ? imagesMeta : images.map((uri) => ({ uri })))
              }
            >
              <View style={styles.aiIconBox}>
                {aiVisionLoading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="sparkles" size={20} color={colors.primary} />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.aiVisionTitle}>
                  {aiVisionLoading ? 'AI đang phân tích ảnh...' : 'Phân tích ảnh bằng AI (Tự động điền)'}
                </Text>
                <Text style={styles.aiVisionSubtitle}>
                  {aiVisionLoading
                    ? 'Đang nhận diện model, danh mục, ngoại hình...'
                    : 'Bấm để AI tự động nhận diện sản phẩm và điền form cho bạn'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Basic Info */}
        <View style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>2. Thông tin cơ bản</Text>
            <Text style={styles.manualNoticeText}>✏️ Tự do chỉnh sửa</Text>
          </View>

          <Input
            label="Tiêu đề bài đăng *"
            value={form.name}
            onChangeText={handleNameChange}
            placeholder="Ví dụ: iPhone 13 128GB Midnight bản VN/A"
            error={errors.name}
          />

          {/* Category Picker */}
          <Text style={styles.inputLabel}>Danh mục sản phẩm *</Text>
          <View style={styles.categoryPills}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.catPill,
                  form.categoryId === c.id && styles.catPillSelected,
                ]}
                onPress={() => handleChangeCategory(c.id)}
              >
                <Ionicons
                  name={c.icon || 'grid-outline'}
                  size={14}
                  color={form.categoryId === c.id ? colors.textInverse : colors.primary}
                  style={{ marginRight: 5 }}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.catPillText,
                    form.categoryId === c.id && styles.catPillTextSelected,
                  ]}
                >
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.categoryId && <Text style={styles.inlineErrorText}>{errors.categoryId}</Text>}

          {form.categoryId === 'cat_other' && (
            <View style={{ marginTop: 12 }}>
              <Input
                label="Tên phân loại cụ thể / Nhãn tùy chỉnh (Khuyên dùng)"
                value={form.customCategoryTag}
                onChangeText={(text) => setForm((p) => ({ ...p, customCategoryTag: text }))}
                placeholder="Ví dụ: Đàn Ukulele, Nước hoa chiết, Bể cá thủy sinh mini..."
                hint="💡 Giúp người mua dễ dàng tìm thấy đồ của bạn hơn khi tìm kiếm theo từ khóa"
              />
            </View>
          )}

          {/* Price inputs */}
          <View style={styles.priceRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="Giá bán (VNĐ) *"
                value={form.price}
                onChangeText={handlePriceChange}
                placeholder="Ví dụ: 11.200.000"
                keyboardType="numeric"
                formatNumber={true}
                error={errors.price}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                label="Giá mua mới"
                value={form.originalPrice}
                onChangeText={handleOriginalPriceChange}
                placeholder="Ví dụ: 18.000.000"
                keyboardType="numeric"
                formatNumber={true}
                error={errors.originalPrice}
              />
            </View>
          </View>

          <Input
            label="Số lượng đang có *"
            value={form.stockQuantity}
            onChangeText={handleStockChange}
            placeholder="1"
            keyboardType="number-pad"
            maxLength={3}
            error={errors.stockQuantity}
          />

          {/* Description */}
          <Input
            label="Mô tả chi tiết và trung thực *"
            value={form.description}
            onChangeText={handleDescriptionChange}
            placeholder="Mô tả chi tiết xuất xứ, thời gian dùng, lý do bán, các lỗi nhỏ..."
            multiline
            numberOfLines={4}
            error={errors.description}
          />
        </View>

        {/* Dynamic Category-Specific Condition Form */}
        <DynamicConditionForm
          category={selectedCategoryObj}
          selectedSubCategoryId={form.subCategoryId}
          onSelectSubCategory={handleSelectSubCategory}
          formData={conditionData}
          onChangeField={handleConditionChange}
          errors={errors}
        />

        {/* Overall Condition Rating */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Đánh giá tình trạng tổng thể *</Text>
          <View style={styles.overallRatingRow}>
            {['Like New', 'Very Good', 'Good', 'Acceptable'].map((cond) => (
              <TouchableOpacity
                key={cond}
                style={[
                  styles.ratingPill,
                  form.overallCondition === cond && styles.ratingPillActive,
                ]}
                onPress={() => {
                  setForm((p) => ({ ...p, overallCondition: cond }));
                  if (errors.overallCondition) setErrors((prev) => ({ ...prev, overallCondition: null }));
                }}
              >
                <Text
                  style={[
                    styles.ratingPillText,
                    form.overallCondition === cond && styles.ratingPillTextActive,
                  ]}
                >
                  {cond === 'Like New'
                    ? 'Như mới'
                    : cond === 'Very Good'
                    ? 'Rất tốt'
                    : cond === 'Good'
                    ? 'Tốt'
                    : 'Chấp nhận được'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.overallCondition && (
            <Text style={styles.inlineErrorText}>{errors.overallCondition}</Text>
          )}
        </View>

        {/* Known Defects Input */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>4. Khai báo vết xước hoặc lỗi đã biết</Text>
          <Text style={styles.sectionNote}>
            Ghi rõ các vết xước, cấn, hao mòn nhẹ để người mua nắm rõ và không xảy ra khiếu nại.
          </Text>

          <View style={styles.defectInputRow}>
            <View style={{ flex: 1 }}>
              <Input
                value={defectInput}
                onChangeText={(t) => {
                  setDefectInput(t);
                  if (defectError) setDefectError('');
                }}
                placeholder="Ví dụ: Vết xước nhẹ ở góc dưới..."
                style={{ marginBottom: 0 }}
                error={defectError}
              />
            </View>
            <TouchableOpacity style={styles.addDefectBtn} onPress={handleAddDefect}>
              <Text style={styles.addDefectBtnText}>+ Thêm lỗi</Text>
            </TouchableOpacity>
          </View>

          {knownDefects.map((def, idx) => (
            <View key={idx} style={styles.defectTag}>
              <Text style={styles.defectTagText}>• {def}</Text>
              <TouchableOpacity onPress={() => handleRemoveDefect(idx)}>
                <Ionicons name="close-circle" size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Seller Location & Map Details */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>5. Vị trí xem hàng & hẹn gặp *</Text>
          <Text style={styles.sectionNote}>
            * Người mua sẽ xem được vị trí ghim này trên bản đồ thực tế và tính khoảng cách di chuyển để hẹn xem hàng trực tiếp.
          </Text>

          {/* Quick Location Action Buttons */}
          <View style={styles.locationActionsRow}>
            <TouchableOpacity
              style={[styles.locationActionBtn, styles.gpsLocationBtn]}
              onPress={handleGetCurrentLocation}
              disabled={locatingGps}
              activeOpacity={0.8}
            >
              {locatingGps ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 6 }} />
              ) : (
                <Ionicons name="navigate" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              )}
              <Text style={styles.gpsLocationBtnText}>
                {locatingGps ? 'Đang định vị GPS...' : '📍 Lấy vị trí hiện tại (GPS)'}
              </Text>
            </TouchableOpacity>

            {defaultUserAddr && (
              <TouchableOpacity
                style={[styles.locationActionBtn, styles.profileLocationBtn]}
                onPress={handleUseProfileAddress}
                activeOpacity={0.8}
              >
                <Ionicons name="bookmark-outline" size={15} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.profileLocationBtnText}>Dùng địa chỉ hồ sơ</Text>
              </TouchableOpacity>
            )}
          </View>

          {customCoordinates && (
            <View style={styles.gpsActiveNotice}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.gpsActiveNoticeText}>
                Đang dùng toạ độ GPS chính xác ({customCoordinates.lat.toFixed(4)}, {customCoordinates.lng.toFixed(4)})
              </Text>
            </View>
          )}

          <View style={styles.priceRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="Tỉnh / Thành phố *"
                value={form.city}
                onChangeText={(t) => {
                  setCustomCoordinates(null);
                  setForm((p) => ({ ...p, city: t }));
                  if (errors.city) setErrors((prev) => ({ ...prev, city: null }));
                }}
                placeholder="TP. Hồ Chí Minh"
                error={errors.city}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                label="Quận / Huyện *"
                value={form.district}
                onChangeText={(t) => {
                  setCustomCoordinates(null);
                  setForm((p) => ({ ...p, district: t }));
                  if (errors.district) setErrors((prev) => ({ ...prev, district: null }));
                }}
                placeholder="Quận 1"
                error={errors.district}
              />
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Input
                label="Phường / Xã"
                value={form.ward}
                onChangeText={(t) => setForm((p) => ({ ...p, ward: t }))}
                placeholder="Phường Bến Nghé"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Input
                label="Số nhà, Tên đường *"
                value={form.streetAddress}
                onChangeText={(t) => {
                  setForm((p) => ({ ...p, streetAddress: t }));
                  if (errors.streetAddress) setErrors((prev) => ({ ...prev, streetAddress: null }));
                }}
                placeholder="123 Lê Lợi"
                error={errors.streetAddress}
              />
            </View>
          </View>

          {/* Mini-Map Preview Card with Real Map Tile */}
          <View style={styles.sellerMapPreviewBox}>
            <View style={styles.miniMapCanvas}>
              {(() => {
                const c = customCoordinates || resolveCoordinates(form.city, form.district);
                const n = Math.pow(2, 15);
                const tx = Math.floor(((c.lng + 180) / 360) * n);
                const latRad = (c.lat * Math.PI) / 180;
                const ty = Math.floor(
                  ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n
                );
                const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/15/${ty}/${tx}`;
                return (
                  <Image
                    source={{ uri: tileUrl }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                  />
                );
              })()}
              <View style={styles.miniMapPin}>
                <Ionicons name="location" size={26} color={colors.danger} />
              </View>
            </View>
            <View style={styles.miniMapInfo}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.miniMapTitle}>Điểm ghim hiển thị cho người mua:</Text>
                {customCoordinates && (
                  <View style={styles.gpsPill}>
                    <Text style={styles.gpsPillText}>GPS</Text>
                  </View>
                )}
              </View>
              <Text style={styles.miniMapAddress} numberOfLines={2}>
                {[form.streetAddress, form.ward, form.district, form.city]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
              <Text style={styles.miniMapHint}>
                🧭 Bản đồ thực tế • Người mua có thể mở Google Maps để dẫn đường
              </Text>
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <Button
          title="Xuất bản bài đăng ngay"
          variant="primary"
          size="lg"
          loading={submitting}
          onPress={handleSubmitListing}
          style={styles.submitBtn}
        />
      </KeyboardAwareScrollView>

      {/* AI VISION ANALYSIS RESULTS MODAL */}
      <Modal
        visible={showAiResultModal}
        onClose={() => setShowAiResultModal(false)}
        title="✨ Kết quả phân tích AI Vision"
        // The result has its own ScrollView so the action footer stays pinned
        scrollable={false}
      >
        {aiVisionResult && (
          <View style={styles.aiModalContainer}>
            <ScrollView
              style={styles.aiModalScroll}
              contentContainerStyle={styles.aiModalScrollContent}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={true}
              keyboardShouldPersistTaps="handled"
            >
              {aiVisionResult.analyzedImageUri && (
                <Image
                  source={{ uri: aiVisionResult.analyzedImageUri }}
                  style={styles.modalPreviewImage}
                />
              )}

              <View style={styles.aiBadgeRow}>
                <View style={styles.confidenceBadge}>
                  <Ionicons name="sparkles" size={13} color="#059669" />
                  <Text style={styles.confidenceText}>
                    {aiVisionResult.isLiveAi ? `Google Gemini (${aiVisionResult.modelUsed || 'AI'})` : 'AI Demo (ngoại tuyến)'} • {aiVisionResult.confidenceScore || 0}%
                  </Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {aiVisionResult.categoryName || 'Chưa rõ danh mục'}
                  </Text>
                </View>
              </View>

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>Tên sản phẩm nhận diện:</Text>
                <Text style={styles.modalFieldValueBold}>{aiVisionResult.name}</Text>
              </View>

              <View style={styles.modalRowGroup}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFieldLabel}>Độ mới ước tính:</Text>
                  <Text style={styles.modalFieldValue}>
                    {aiVisionResult.overallCondition === 'Like New'
                      ? 'Như mới'
                      : aiVisionResult.overallCondition === 'Very Good'
                      ? 'Rất tốt'
                      : aiVisionResult.overallCondition === 'Acceptable'
                      ? 'Chấp nhận được'
                      : 'Tốt'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFieldLabel}>Giá đồ cũ AI ước lượng:</Text>
                  <Text style={[styles.modalFieldValueBold, { color: colors.primary }]}>
                    {aiVisionResult.suggestedPrice
                      ? formatCurrency(aiVisionResult.suggestedPrice)
                      : 'Thương lượng'}
                  </Text>
                  {aiVisionResult.priceMax > 0 && (
                    <Text style={styles.modalFieldLabel}>
                      Khoảng {formatCurrency(aiVisionResult.priceMin)} - {formatCurrency(aiVisionResult.priceMax)}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>Mô tả chi tiết sinh tự động:</Text>
                <Text style={styles.modalFieldDesc}>{aiVisionResult.description}</Text>
              </View>

              {aiVisionResult.knownDefects && aiVisionResult.knownDefects.length > 0 && (
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>Khuyết điểm quan sát qua ảnh:</Text>
                  {aiVisionResult.knownDefects.map((d, i) => (
                    <Text key={i} style={styles.modalDefectItem}>
                      • {d}
                    </Text>
                  ))}
                </View>
              )}

              {(aiVisionResult.photoQualityIssue || aiVisionResult.uncertainFields?.length > 0) && (
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>⚠️ AI chưa chắc chắn, vui lòng kiểm tra lại:</Text>
                  {aiVisionResult.photoQualityIssue ? (
                    <Text style={styles.modalDefectItem}>• {aiVisionResult.photoQualityIssue}</Text>
                  ) : null}
                  {aiVisionResult.uncertainFields?.map((f, i) => (
                    <Text key={i} style={styles.modalDefectItem}>
                      • {f}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.modalNoticeBox}>
                <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
                <Text style={styles.modalNoticeText}>
                  [Bản nháp - vui lòng kiểm tra] AI chỉ gợi ý dựa trên ảnh, không đảm bảo tình trạng thật. Bạn chịu trách nhiệm rà soát và sửa mọi thông tin trước khi đăng.
                </Text>
              </View>
            </ScrollView>

            {/* Sticky Action Footer - Always visible, never cut off */}
            <View style={styles.aiModalFooter}>
              <Button
                title="✅ Áp dụng vào tin đăng"
                variant="primary"
                size="md"
                onPress={handleApplyAiVisionResult}
                style={styles.aiApplyBtn}
              />
              <TouchableOpacity
                onPress={() => setShowAiResultModal(false)}
                style={styles.aiCancelBtn}
              >
                <Text style={styles.aiCancelBtnText}>Đóng & Giữ form hiện tại</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  inlineErrorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPromptBox: {
    width: '85%',
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  guestTitle: {
    ...typography.h2,
    fontSize: 18,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  guestSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  scrollContent: {
    padding: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.sm,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 15,
    color: colors.textPrimary,
  },
  sectionNote: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  labelCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  charCountText: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
  },
  charCountNotice: {
    color: '#D97706',
    fontWeight: '600',
  },
  charCountOver: {
    color: colors.danger,
    fontWeight: '700',
  },
  fieldInlineError: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
    marginBottom: 6,
  },
  categoryPillsError: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    padding: 6,
    borderRadius: borderRadius.md,
  },
  imageErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  imageErrorText: {
    ...typography.caption,
    color: colors.danger,
    fontWeight: '600',
  },
  pricePreviewText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    fontSize: 11,
    marginTop: -8,
    marginBottom: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  manualNoticeText: {
    ...typography.caption,
    marginLeft: spacing.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  imagesRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  imageThumbWrapper: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  addImageText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
    fontSize: 10,
  },
  aiVisionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginTop: spacing.xs,
  },
  aiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  aiVisionTitle: {
    ...typography.subtitle,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  aiVisionSubtitle: {
    ...typography.caption,
    fontSize: 11,
    color: '#065F46',
    marginTop: 1,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.xs,
  },
  categoryPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
    flexShrink: 0,
    alignSelf: 'flex-start',
  },
  catPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catPillText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    fontWeight: '600',
    flexShrink: 0,
  },
  catPillTextSelected: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
  },
  overallRatingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  ratingPill: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  ratingPillActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  ratingPillText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  ratingPillTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  defectInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  addDefectBtn: {
    backgroundColor: colors.primarySoft,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginLeft: 8,
  },
  addDefectBtnText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  defectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: borderRadius.sm,
    marginTop: 4,
  },
  defectTagText: {
    ...typography.caption,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  aiModalContainer: {
    flexShrink: 1,
  },
  aiModalScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  aiModalScrollContent: {
    paddingBottom: spacing.sm,
  },
  aiModalFooter: {
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  aiApplyBtn: {
    width: '100%',
  },
  aiCancelBtn: {
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  aiCancelBtnText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  modalPreviewImage: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.borderLight,
  },
  aiBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    marginRight: 8,
    marginBottom: 6,
  },
  confidenceText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 4,
  },
  categoryBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    marginBottom: 6,
  },
  categoryBadgeText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  modalFieldGroup: {
    marginBottom: spacing.sm + 2,
  },
  modalRowGroup: {
    flexDirection: 'row',
    marginBottom: spacing.sm + 2,
  },
  modalFieldLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  modalFieldValueBold: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalFieldValue: {
    ...typography.bodySmall,
    color: colors.textPrimary,
  },
  modalFieldDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 19,
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  modalDefectItem: {
    ...typography.caption,
    color: '#92400E',
    marginTop: 2,
  },
  modalNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  modalNoticeText: {
    ...typography.caption,
    color: '#0369A1',
    flex: 1,
    marginLeft: 6,
    fontSize: 11,
  },
  locationActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  locationActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
  },
  gpsLocationBtn: {
    backgroundColor: colors.primary,
    flex: 1,
    marginRight: 8,
  },
  gpsLocationBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    flexShrink: 1,
  },
  profileLocationBtn: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  profileLocationBtnText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
    flexShrink: 1,
  },
  gpsActiveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  gpsActiveNoticeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
    marginLeft: 6,
    flex: 1,
  },
  gpsPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.pill,
    marginLeft: 6,
  },
  gpsPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#065F46',
  },
  useProfileAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.pill,
  },
  useProfileAddrText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4,
  },
  sellerMapPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.sm,
  },
  miniMapCanvas: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  miniMapGridLineH: {
    position: 'absolute',
    top: 28,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#CBD5E1',
  },
  miniMapGridLineV: {
    position: 'absolute',
    left: 28,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#CBD5E1',
  },
  miniMapPin: {
    ...shadows.sm,
  },
  miniMapInfo: {
    flex: 1,
    marginLeft: 10,
  },
  miniMapTitle: {
    ...typography.caption,
    flexShrink: 1,
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  miniMapAddress: {
    ...typography.subtitle,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  miniMapHint: {
    ...typography.caption,
    fontSize: 10,
    color: '#059669',
    marginTop: 3,
  },
});
