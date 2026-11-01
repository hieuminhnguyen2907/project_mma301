// Location & Geographic Distance Helper for ReMarket
// Provides coordinates, address formatting, and distance calculations for C2C local trading

export const VIETNAM_POPULAR_LOCATIONS = [
  // TP. Hồ Chí Minh
  {
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    coordinates: { lat: 10.7769, lng: 106.7009 },
  },
  {
    city: 'Hồ Chí Minh',
    district: 'Quận 3',
    ward: 'Phường Võ Thị Sáu',
    coordinates: { lat: 10.7844, lng: 106.6844 },
  },
  {
    city: 'Hồ Chí Minh',
    district: 'Quận 5',
    ward: 'Phường 2',
    coordinates: { lat: 10.7553, lng: 106.6791 },
  },
  {
    city: 'Hồ Chí Minh',
    district: 'Quận 7',
    ward: 'Phường Tân Phong',
    coordinates: { lat: 10.734, lng: 106.7218 },
  },
  {
    city: 'Hồ Chí Minh',
    district: 'Bình Thạnh',
    ward: 'Phường 25',
    coordinates: { lat: 10.8106, lng: 106.7091 },
  },
  {
    city: 'Hồ Chí Minh',
    district: 'Tân Bình',
    ward: 'Phường 2',
    coordinates: { lat: 10.8015, lng: 106.6548 },
  },
  {
    city: 'Hồ Chí Minh',
    district: 'TP. Thủ Đức',
    ward: 'Phường Thảo Điền',
    coordinates: { lat: 10.805, lng: 106.732 },
  },

  // Hà Nội
  {
    city: 'Hà Nội',
    district: 'Hoàn Kiếm',
    ward: 'Phường Hàng Trống',
    coordinates: { lat: 21.0285, lng: 105.8542 },
  },
  {
    city: 'Hà Nội',
    district: 'Đống Đa',
    ward: 'Phường Ô Chợ Dừa',
    coordinates: { lat: 21.0181, lng: 105.8299 },
  },
  {
    city: 'Hà Nội',
    district: 'Cầu Giấy',
    ward: 'Phường Dịch Vọng Hậu',
    coordinates: { lat: 21.0362, lng: 105.7906 },
  },
  {
    city: 'Hà Nội',
    district: 'Ba Đình',
    ward: 'Phường Liễu Giai',
    coordinates: { lat: 21.0341, lng: 105.8244 },
  },
  {
    city: 'Hà Nội',
    district: 'Thanh Xuân',
    ward: 'Phường Nhân Chính',
    coordinates: { lat: 20.998, lng: 105.808 },
  },

  // Đà Nẵng
  {
    city: 'Đà Nẵng',
    district: 'Hải Châu',
    ward: 'Phường Thạch Thang',
    coordinates: { lat: 16.0544, lng: 108.2208 },
  },
  {
    city: 'Đà Nẵng',
    district: 'Sơn Trà',
    ward: 'Phường An Hải Bắc',
    coordinates: { lat: 16.0825, lng: 108.2432 },
  },
];

// Haversine formula to compute great-circle distance between two points in km
export function getDistanceInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;

  const R = 6371; // Earth's radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Estimate travel time by motorbike (average 25 km/h in urban Vietnam)
export function getEstimatedTravelTime(distanceKm) {
  if (!distanceKm || distanceKm <= 0) return '5 phút';
  const minutes = Math.max(5, Math.round((distanceKm / 25) * 60));
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours} giờ ${remMinutes} phút` : `${hours} giờ`;
}

// Resolve coordinates for given city & district (or return custom GPS coordinates if present)
export function resolveCoordinates(city, district, customCoordinates = null) {
  if (
    customCoordinates &&
    typeof customCoordinates.lat === 'number' &&
    typeof customCoordinates.lng === 'number'
  ) {
    return customCoordinates;
  }

  const match = VIETNAM_POPULAR_LOCATIONS.find(
    (loc) =>
      loc.city.toLowerCase().includes((city || '').toLowerCase().trim()) &&
      loc.district.toLowerCase().includes((district || '').toLowerCase().trim())
  );

  if (match) return match.coordinates;

  // Defaults per city
  const lowerCity = (city || '').toLowerCase();
  if (lowerCity.includes('hà nội') || lowerCity.includes('ha noi')) {
    return { lat: 21.0285, lng: 105.8542 };
  }
  if (lowerCity.includes('đà nẵng') || lowerCity.includes('da nang')) {
    return { lat: 16.0544, lng: 108.2208 };
  }
  return { lat: 10.7769, lng: 106.7009 }; // Default HCMC
}

// Parse Expo Location reverse-geocode object into standardized Vietnamese address components
export function parseGeocodeAddress(addr) {
  if (!addr) return null;

  const rawRegion = (addr.region || '').trim();
  const rawCity = (addr.city || '').trim();
  const rawSubregion = (addr.subregion || '').trim();
  const rawDistrict = (addr.district || '').trim();

  let city = '';
  let district = '';
  let ward = '';

  // 1. Detect City / Province
  if (
    rawRegion.toLowerCase().includes('hồ chí minh') ||
    rawCity.toLowerCase().includes('hồ chí minh')
  ) {
    city = 'Hồ Chí Minh';
  } else if (
    rawRegion.toLowerCase().includes('hà nội') ||
    rawCity.toLowerCase().includes('hà nội')
  ) {
    city = 'Hà Nội';
  } else if (
    rawRegion.toLowerCase().includes('đà nẵng') ||
    rawCity.toLowerCase().includes('đà nẵng')
  ) {
    city = 'Đà Nẵng';
  } else {
    city = rawRegion || rawCity || 'Hồ Chí Minh';
  }

  // 2. Detect District
  if (
    rawCity &&
    rawCity !== city &&
    !rawCity.toLowerCase().includes('thành phố') &&
    !rawCity.toLowerCase().includes('tỉnh')
  ) {
    district = rawCity;
  } else if (rawSubregion && rawSubregion !== city) {
    district = rawSubregion;
  } else if (rawDistrict && rawDistrict !== city) {
    district = rawDistrict;
  }

  // 3. Detect Ward
  if (rawDistrict && rawDistrict !== district && rawDistrict !== city) {
    ward = rawDistrict;
  } else if (rawSubregion && rawSubregion !== district && rawSubregion !== city) {
    ward = rawSubregion;
  }

  // 4. Street Address
  let streetAddress = '';
  const streetParts = [addr.streetNumber, addr.street].filter(Boolean);
  if (streetParts.length > 0) {
    streetAddress = streetParts.join(' ');
  } else if (addr.name && addr.name !== district && addr.name !== city) {
    streetAddress = addr.name;
  }

  return {
    city: city || 'Hồ Chí Minh',
    district: district || 'Quận 1',
    ward: ward || '',
    streetAddress: streetAddress || '',
  };
}
