import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  Platform,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, shadows } from '../../config/theme';
import {
  getDistanceInKm,
  getEstimatedTravelTime,
  resolveCoordinates,
} from '../../utils/locationHelper';

const TILE_SIZE = 256;
const MAP_CONTAINER_HEIGHT = 220;

export const ProductLocationMap = ({
  location,
  sellerName,
  buyerAddress,
  onMeetupPress,
  style,
}) => {
  const [zoom, setZoom] = useState(15); // Zoom levels: 14 (District), 15 (Neighborhood), 16 (Street), 17 (Building)
  const [mapType, setMapType] = useState('street'); // 'street' or 'satellite' (both Esri)
  const [containerWidth, setContainerWidth] = useState(340);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [tilesLoading, setTilesLoading] = useState(true);

  // New zoom level / layer means new tiles to fetch
  useEffect(() => {
    setTilesLoading(true);
  }, [zoom, mapType]);

  const city = location?.city || 'Hồ Chí Minh';
  const district = location?.district || 'Quận 1';
  const ward = location?.ward || '';
  const streetAddress = location?.streetAddress || location?.street || '';

  const fullAddress =
    location?.fullAddress ||
    [streetAddress, ward, district, city].filter(Boolean).join(', ');

  const coords =
    location?.coordinates?.lat && location?.coordinates?.lng
      ? location.coordinates
      : resolveCoordinates(city, district);

  // Distance only when the buyer has a saved address: no made-up figures. It is an
  // estimate between district centres, labelled with "~".
  const buyerCoords = buyerAddress
    ? resolveCoordinates(buyerAddress.city, buyerAddress.district)
    : null;
  const distanceKm = buyerCoords
    ? getDistanceInKm(buyerCoords.lat, buyerCoords.lng, coords.lat, coords.lng)
    : null;
  const hasDistance = typeof distanceKm === 'number';
  const travelTime = hasDistance ? getEstimatedTravelTime(distanceKm) : null;

  // Interactive Pan Responder for smooth touch map dragging
  // (panRef mirrors state: the responder is created once, so reading `pan` inside it
  // would always see the initial {0,0} and every new drag would jump back to centre)
  const panStartRef = useRef({ x: 0, y: 0 });
  const panRef = useRef(pan);
  panRef.current = pan;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        panStartRef.current = { ...panRef.current };
      },
      onPanResponderMove: (_, gesture) => {
        setPan({
          x: panStartRef.current.x + gesture.dx,
          y: panStartRef.current.y + gesture.dy,
        });
      },
    })
  ).current;

  // Slippy Map Math: converts latitude & longitude to exact 3x3 tile grid
  const { tiles, gridStyle, pinStyle } = useMemo(() => {
    const n = Math.pow(2, zoom);
    const exactX = ((coords.lng + 180) / 360) * n;
    const latRad = (coords.lat * Math.PI) / 180;
    const exactY =
      ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n;

    const centerTileX = Math.floor(exactX);
    const centerTileY = Math.floor(exactY);

    const subOffsetX = (exactX - centerTileX) * TILE_SIZE;
    const subOffsetY = (exactY - centerTileY) * TILE_SIZE;

    // Generate 3x3 surrounding real map tiles
    const tileList = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = centerTileX + dx;
        const ty = centerTileY + dy;

        let url;
        if (mapType === 'satellite') {
          // ESRI World Satellite Imagery (High-Res True Satellite Photos)
          url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ty}/${tx}.jpg`;
        } else {
          // Esri World Street Map (CARTO basemaps now require an API key and only
          // serve an "API KEY REQUIRED" placeholder tile)
          url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${ty}/${tx}`;
        }

        tileList.push({
          key: `${mapType}_${tx}_${ty}_${zoom}`,
          url,
          left: (dx + 1) * TILE_SIZE,
          top: (dy + 1) * TILE_SIZE,
        });
      }
    }

    const centerX = containerWidth / 2;
    const centerY = MAP_CONTAINER_HEIGHT / 2;

    const computedGridStyle = {
      position: 'absolute',
      width: TILE_SIZE * 3,
      height: TILE_SIZE * 3,
      left: centerX - TILE_SIZE - subOffsetX + pan.x,
      top: centerY - TILE_SIZE - subOffsetY + pan.y,
    };

    const computedPinStyle = {
      position: 'absolute',
      left: centerX + pan.x,
      top: centerY + pan.y,
      marginLeft: -16,
      marginTop: -38,
    };

    return { tiles: tileList, gridStyle: computedGridStyle, pinStyle: computedPinStyle };
  }, [coords.lat, coords.lng, zoom, mapType, containerWidth, pan]);

  // Open official Google Maps / Apple Maps navigation
  const handleOpenGoogleMaps = async () => {
    const encodedAddress = encodeURIComponent(fullAddress || `${district}, ${city}`);
    const googleMapsWebUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
    const nativeScheme =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${encodedAddress}@${coords.lat},${coords.lng}`
        : `geo:${coords.lat},${coords.lng}?q=${coords.lat},${coords.lng}(${encodedAddress})`;

    try {
      const canOpen = await Linking.canOpenURL(nativeScheme);
      if (canOpen) {
        await Linking.openURL(nativeScheme);
      } else {
        await Linking.openURL(googleMapsWebUrl);
      }
    } catch (_err) {
      Linking.openURL(googleMapsWebUrl);
    }
  };

  const handleCopyAddress = () => {
    Alert.alert(
      '📍 Địa chỉ xem hàng',
      `${fullAddress}\n\n• Khu vực: ${district}, ${city}${
        hasDistance ? `\n• Khoảng cách ước tính: ~${distanceKm} km (${travelTime} di chuyển)` : ''
      }`,
      [
        { text: 'Đóng' },
        { text: 'Mở Google Maps', onPress: handleOpenGoogleMaps },
      ]
    );
  };

  const handleResetPan = () => {
    setPan({ x: 0, y: 0 });
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name="map" size={18} color={colors.primary} />
          </View>
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.title}>Bản đồ vị trí & Điểm xem hàng</Text>
            <Text style={styles.subtitle}>Bản đồ thực tế • Hỗ trợ qua xem trực tiếp</Text>
          </View>
        </View>

        {hasDistance && (
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={12} color="#059669" />
            <Text style={styles.distanceText}>~{distanceKm} km</Text>
          </View>
        )}
      </View>

      {/* Real Map Container with Slippy Tile Engine */}
      <View
        style={styles.mapCanvasWrapper}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        {...panResponder.panHandlers}
      >
        {/* Layer 1: Real Map Tiles (Esri street / satellite) */}
        <View style={gridStyle}>
          {tiles.map((t) => (
            <Image
              key={t.key}
              source={{ uri: t.url }}
              style={[styles.tileImage, { left: t.left, top: t.top }]}
              onLoadEnd={() => setTilesLoading(false)}
            />
          ))}
        </View>

        {tilesLoading && (
          <View style={styles.tilesLoadingOverlay} pointerEvents="none">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {/* Layer 2: Meetup Radius Circle (500m safe meetup zone) */}
        <View
          style={[
            styles.radiusCircle,
            {
              left: containerWidth / 2 + pan.x - 65,
              top: MAP_CONTAINER_HEIGHT / 2 + pan.y - 65,
            },
          ]}
          pointerEvents="none"
        />

        {/* Layer 3: Interactive Seller Pin Marker */}
        <View style={pinStyle} pointerEvents="none">
          <View style={styles.pinBubble}>
            <Ionicons name="bag-handle" size={12} color={colors.textInverse} />
            <Text style={styles.pinBubbleText}>
              {sellerName ? `${sellerName}` : 'Người bán'}
            </Text>
          </View>
          <View style={styles.pinPinWrapper}>
            <Ionicons name="location" size={34} color={colors.danger} />
            <View style={styles.pinDotWhite} />
          </View>
        </View>

        {/* Layer 4: Map Controls Top Bar (Layer Switcher: Street vs Satellite) */}
        <View style={styles.mapLayerSwitcher}>
          <TouchableOpacity
            style={[
              styles.layerBtn,
              mapType === 'street' && styles.layerBtnActive,
            ]}
            onPress={() => setMapType('street')}
          >
            <Ionicons
              name="map-outline"
              size={12}
              color={mapType === 'street' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.layerBtnText,
                mapType === 'street' && styles.layerBtnTextActive,
              ]}
            >
              Đường phố
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.layerBtn,
              mapType === 'satellite' && styles.layerBtnActive,
            ]}
            onPress={() => setMapType('satellite')}
          >
            <Ionicons
              name="earth-outline"
              size={12}
              color={mapType === 'satellite' ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.layerBtnText,
                mapType === 'satellite' && styles.layerBtnTextActive,
              ]}
            >
              Vệ tinh
            </Text>
          </TouchableOpacity>
        </View>

        {/* Layer 5: Map Zoom & Re-Center Controls */}
        <View style={styles.mapSideControls}>
          <TouchableOpacity
            style={styles.mapControlBtn}
            onPress={() => setZoom((z) => Math.min(17, z + 1))}
          >
            <Ionicons name="add" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.controlDivider} />
          <TouchableOpacity
            style={styles.mapControlBtn}
            onPress={() => setZoom((z) => Math.max(13, z - 1))}
          >
            <Ionicons name="remove" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.controlDivider} />
          <TouchableOpacity style={styles.mapControlBtn} onPress={handleResetPan}>
            <Ionicons name="locate" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Map Drag Hint Badge */}
        <View style={styles.dragHintBox} pointerEvents="none">
          <Ionicons name="hand-right-outline" size={11} color="rgba(255,255,255,0.9)" />
          <Text style={styles.dragHintText}>Chạm & Kéo để di chuyển bản đồ</Text>
        </View>

        {/* Watermark / Data Source */}
        <View style={styles.mapWatermark} pointerEvents="none">
          <Text style={styles.mapWatermarkText}>
            {mapType === 'satellite' ? '© Esri World Imagery' : '© Esri, HERE, OpenStreetMap'}
          </Text>
        </View>
      </View>

      {/* Address Details Card */}
      <View style={styles.addressInfoBox}>
        <View style={styles.addressRow}>
          <Ionicons name="location-sharp" size={20} color={colors.danger} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.addressTitle}>Địa chỉ người bán:</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {fullAddress}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={handleCopyAddress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="copy-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.metaBadgeRow}>
          {hasDistance && (
            <View style={styles.travelTimeBadge}>
              <Ionicons name="bicycle-outline" size={14} color="#0284C7" />
              <Text style={styles.travelTimeText}>Xe máy: ~{travelTime}</Text>
            </View>
          )}
          <View style={styles.verifiedZoneBadge}>
            <Ionicons name="information-circle-outline" size={13} color="#059669" />
            <Text style={styles.verifiedZoneText}>Vị trí do người bán khai báo</Text>
          </View>
        </View>

        <Text style={styles.safetyHint}>
          💡 Gợi ý an toàn: Bạn có thể hẹn người bán tại địa điểm công cộng gần khu vực này (quán cà phê, sảnh chung cư) để kiểm tra hàng trực tiếp trước khi thanh toán.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.googleMapsBtn}
          onPress={handleOpenGoogleMaps}
        >
          <Ionicons name="navigate" size={16} color={colors.textInverse} />
          <Text style={styles.googleMapsBtnText}>Mở Google Maps chỉ đường</Text>
        </TouchableOpacity>

        {onMeetupPress && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.meetupChatBtn}
            onPress={() => onMeetupPress(fullAddress)}
          >
            <Ionicons name="chatbubbles" size={16} color={colors.primary} />
            <Text style={styles.meetupChatBtnText}>Hẹn xem hàng</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tilesLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.subtitle,
    fontWeight: '700',
    fontSize: 14,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textSecondary,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginLeft: 3,
  },
  mapCanvasWrapper: {
    height: MAP_CONTAINER_HEIGHT,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileImage: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#E2E8F0',
  },
  radiusCircle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(15, 118, 110, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(15, 118, 110, 0.45)',
    borderStyle: 'dashed',
  },
  pinBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    alignSelf: 'center',
    ...shadows.sm,
  },
  pinBubbleText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  pinPinWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
    position: 'relative',
  },
  pinDotWhite: {
    position: 'absolute',
    top: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  mapLayerSwitcher: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: borderRadius.pill,
    padding: 3,
    ...shadows.sm,
  },
  layerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
  },
  layerBtnActive: {
    backgroundColor: colors.primarySoft,
  },
  layerBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    marginLeft: 3,
  },
  layerBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  mapSideControls: {
    position: 'absolute',
    right: 10,
    bottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  mapControlBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  dragHintBox: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  dragHintText: {
    fontSize: 9,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  mapWatermark: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  },
  mapWatermarkText: {
    fontSize: 8,
    color: colors.textMuted,
  },
  addressInfoBox: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    fontSize: 11,
  },
  addressText: {
    ...typography.subtitle,
    fontWeight: '700',
    color: colors.textPrimary,
    fontSize: 13,
    marginTop: 2,
  },
  copyBtn: {
    padding: 6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginLeft: 6,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  travelTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
    marginRight: 8,
  },
  travelTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
    marginLeft: 4,
  },
  verifiedZoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.pill,
  },
  verifiedZoneText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 4,
  },
  safetyHint: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  googleMapsBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    marginRight: 8,
    ...shadows.sm,
  },
  googleMapsBtnText: {
    color: colors.textInverse,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6,
  },
  meetupChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  meetupChatBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
    marginLeft: 6,
  },
});
