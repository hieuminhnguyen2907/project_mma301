import { MOCK_PRODUCTS } from './mockData.js';
import { db, isLiveFirebase } from '../config/firebase.js';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { storage } from '../utils/storage.js';
import { deepClone } from '../utils/clone.js';
import { imageUploadService } from './imageUploadService.js';
import { notificationService } from './notificationService.js';

const checkoutError = (code, message) => {
  const err = new Error(message);
  err.code = code;
  return err;
};

// In-memory products store initialized with MOCK_PRODUCTS
// (deep copy: MOCK_PRODUCTS is also Redux initial state, which Immer freezes)
let productsStore = deepClone(MOCK_PRODUCTS);
let favoritesStore = [];

// Search runs on every keystroke: re-reading the whole products collection each time
// is slow and costly, so a remote snapshot is reused for a short while
const REMOTE_CACHE_MS = 15000;
let lastRemoteFetchAt = 0;

const syncFromFirestore = async (forceRefresh) => {
  if (!isLiveFirebase || !db) return;
  if (!forceRefresh && Date.now() - lastRemoteFetchAt < REMOTE_CACHE_MS) return;
  try {
    const snapshot = await getDocs(collection(db, 'products'));
    lastRemoteFetchAt = Date.now();
    if (!snapshot.empty) {
      productsStore = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  } catch (err) {
    console.warn('⚠️ [Firestore] getProducts fallback to cache:', err.message);
  }
};

const MODERATION_NOTICES = {
  approve: { type: 'LISTING_APPROVED', title: 'Tin đăng đã được duyệt' },
  reject: { type: 'LISTING_REJECTED', title: 'Tin đăng bị từ chối' },
  hide: { type: 'LISTING_HIDDEN', title: 'Tin đăng bị quản trị viên tạm ẩn' },
};

export const productService = {
  // Fetch active products with filters and sorting
  async getProducts({
    categoryId,
    query: searchKeyword,
    minPrice,
    maxPrice,
    conditionRating,
    sortBy = 'newest',
    sellerId,
    includeAllStatuses = false,
    forceRefresh = false,
  } = {}) {
    // 1. If Live Firebase is connected, refresh from Cloud Firestore (short-lived cache)
    await syncFromFirestore(forceRefresh);

    let results =
      sellerId || includeAllStatuses
        ? [...productsStore]
        : productsStore.filter((p) => p.status === 'active' || p.status === 'sold_out');

    if (sellerId) {
      results = results.filter((p) => p.sellerId === sellerId);
    }

    if (categoryId && categoryId !== 'all') {
      results = results.filter((p) => p.categoryId === categoryId);
    }

    if (searchKeyword) {
      const q = searchKeyword.toLowerCase().trim();
      results = results.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.categoryName || '').toLowerCase().includes(q) ||
          (p.subCategoryName || '').toLowerCase().includes(q) ||
          (p.customCategoryTag || '').toLowerCase().includes(q)
      );
    }

    if (minPrice !== undefined && minPrice !== null) {
      results = results.filter((p) => p.price >= Number(minPrice));
    }

    if (maxPrice !== undefined && maxPrice !== null && maxPrice > 0) {
      results = results.filter((p) => p.price <= Number(maxPrice));
    }

    if (conditionRating) {
      results = results.filter(
        (p) => p.condition?.overallRating === conditionRating
      );
    }

    // Sort
    if (sortBy === 'price_asc') {
      results.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      results.sort((a, b) => b.price - a.price);
    } else {
      // Default: newest
      results.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return deepClone(results);
  },

  // Get single product detail by ID
  async getProductById(id) {
    if (isLiveFirebase && db) {
      try {
        const snap = await getDoc(doc(db, 'products', id));
        if (snap.exists()) {
          const fresh = { id: snap.id, ...snap.data() };
          // Keep the local copy current: checkout validates against it
          const index = productsStore.findIndex((p) => p.id === id);
          if (index === -1) productsStore.push(fresh);
          else productsStore[index] = fresh;
          return deepClone(fresh);
        }
      } catch (err) {
        console.warn('⚠️ [Firestore] getProductById fallback:', err.message);
      }
    }

    const product = productsStore.find((p) => p.id === id);
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    return deepClone(product);
  },

  // Create new listing
  async createProduct(data, seller) {
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!data.images || data.images.length === 0) {
      throw new Error('Vui lòng thêm ít nhất 1 ảnh thực tế của sản phẩm');
    }
    // Local photos must become URLs other devices can load (never save a file:// path)
    const resolvedImages = await imageUploadService.uploadImages(data.images, seller?.uid, 'products');

    const newProduct = {
      id: `prod_${Date.now()}`,
      sellerId: seller.uid,
      sellerName: seller.displayName,
      sellerAvatar: seller.avatarUrl || null,
      // A seller without reviews has no rating yet (shown as "Người bán mới")
      sellerRating: seller.ratingCount > 0 ? seller.ratingAverage : null,
      sellerRatingCount: seller.ratingCount || 0,
      name: data.name.trim(),
      categoryId: data.categoryId,
      categoryName: data.categoryName || 'Sản phẩm khác',
      description: data.description.trim(),
      price: Number(data.price),
      originalPrice: data.originalPrice ? Number(data.originalPrice) : null,
      stockQuantity: Math.max(1, Math.floor(Number(data.stockQuantity) || 1)),
      reservedQuantity: 0,
      images: resolvedImages,
      primaryImage: resolvedImages[0],
      condition: data.condition || {
        overallRating: data.overallCondition || 'Good',
      },
      knownDefects: data.knownDefects || [],
      deliveryInfo: {
        methods: ['Giao hàng tiêu chuẩn'],
        shippingFeeEstimate: 30000,
      },
      location: data.location || {
        city: data.city || 'Hồ Chí Minh',
        district: 'Quận 1',
      },
      status: 'active', // MVP: published immediately, admins moderate afterwards
      hiddenBy: null,
      viewCount: 0,
      favoriteCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isLiveFirebase && db) {
      // A listing that never reached Firestore is invisible to every other buyer:
      // report the failure instead of pretending it was published
      try {
        await setDoc(doc(db, 'products', newProduct.id), newProduct);
      } catch (err) {
        throw new Error(`Không thể đăng tin lên máy chủ (${err.message}). Vui lòng thử lại.`);
      }
    }

    productsStore.unshift(newProduct);

    return deepClone(newProduct);
  },

  // Update existing listing
  async updateProduct(id, updateData, sellerId) {
    const index = productsStore.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Không tìm thấy sản phẩm');

    // Security check: Must be owner
    if (productsStore[index].sellerId !== sellerId) {
      throw new Error('Bạn không có quyền chỉnh sửa sản phẩm này');
    }
    // Moderation fields belong to admins (sellers use setListingVisibility to hide/show)
    if ('status' in updateData || 'hiddenBy' in updateData || 'rejectionReason' in updateData) {
      throw new Error('Không thể đổi trạng thái kiểm duyệt của tin đăng tại đây');
    }

    productsStore[index] = {
      ...productsStore[index],
      ...updateData,
      updatedAt: new Date().toISOString(),
    };

    if (isLiveFirebase && db) {
      try {
        await updateDoc(doc(db, 'products', id), {
          ...updateData,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('⚠️ [Firestore] updateProduct failed:', err.message);
      }
    }

    return deepClone(productsStore[index]);
  },

  // Seller hides / re-shows their own listing. A listing hidden or rejected by an admin
  // stays that way: the seller cannot bypass moderation.
  async setListingVisibility(id, visible, sellerId) {
    const index = productsStore.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Không tìm thấy sản phẩm');
    const current = productsStore[index];

    if (current.sellerId !== sellerId) {
      throw new Error('Bạn không có quyền chỉnh sửa sản phẩm này');
    }
    if (current.status === 'rejected') {
      throw new Error('Tin đăng đã bị quản trị viên từ chối, không thể hiển thị lại');
    }
    if (current.status === 'hidden' && current.hiddenBy === 'admin') {
      throw new Error('Tin đăng đang bị quản trị viên tạm ẩn. Vui lòng liên hệ quản trị viên để được xem xét lại.');
    }

    const changes = visible
      ? { status: current.stockQuantity > 0 ? 'active' : 'sold_out', hiddenBy: null }
      : { status: 'hidden', hiddenBy: 'seller' };
    changes.updatedAt = new Date().toISOString();

    if (isLiveFirebase && db) {
      await updateDoc(doc(db, 'products', id), changes);
    }
    productsStore[index] = { ...current, ...changes };
    return deepClone(productsStore[index]);
  },

  // Toggle favorite (Supports both Logged-in user and Guest with persistent AsyncStorage)
  async toggleFavorite(userId = 'guest_device', productId) {
    const targetUserId = userId || 'guest_device';

    // Ensure memory store is synced with persistent storage
    if (favoritesStore.length === 0) {
      try {
        const persisted = await storage.getFavorites();
        if (Array.isArray(persisted) && persisted.length > 0) {
          favoritesStore = persisted;
        }
      } catch (_e) {}
    }

    const key = `${targetUserId}:::${productId}`;
    const exists = favoritesStore.includes(key);

    let isFav;
    if (exists) {
      favoritesStore = favoritesStore.filter((k) => k !== key);
      const prod = productsStore.find((p) => p.id === productId);
      if (prod && prod.favoriteCount > 0) prod.favoriteCount -= 1;
      isFav = false; // not favorited
    } else {
      favoritesStore.push(key);
      const prod = productsStore.find((p) => p.id === productId);
      if (prod) prod.favoriteCount = (prod.favoriteCount || 0) + 1;
      isFav = true; // favorited
    }

    // Persist to storage
    try {
      await storage.saveFavorites(favoritesStore);
    } catch (_e) {}

    return isFav;
  },

  // Get user's favorites
  async getFavoriteProducts(userId = 'guest_device') {
    const targetUserId = userId || 'guest_device';

    try {
      const persisted = await storage.getFavorites();
      if (Array.isArray(persisted) && persisted.length > 0) {
        favoritesStore = [...new Set([...favoritesStore, ...persisted])];
      }
    } catch (_e) {}

    const userKeys = favoritesStore.filter((k) => k.startsWith(`${targetUserId}:::`));
    const prodIds = userKeys.map((k) => k.split(':::')[1]);
    return deepClone(productsStore.filter((p) => prodIds.includes(p.id)));
  },

  // Migrate guest favorites to logged-in user account
  async migrateGuestFavorites(userId) {
    if (!userId || userId === 'guest_device') return;
    try {
      const persisted = await storage.getFavorites();
      if (Array.isArray(persisted)) favoritesStore = [...new Set([...favoritesStore, ...persisted])];
    } catch (_e) {}
    const guestKeys = favoritesStore.filter((k) => k.startsWith('guest_device:::'));
    if (guestKeys.length > 0) {
      guestKeys.forEach((gk) => {
        const prodId = gk.split(':::')[1];
        const userKey = `${userId}:::${prodId}`;
        if (!favoritesStore.includes(userKey)) {
          favoritesStore.push(userKey);
        }
      });
      // Moved, not copied: the next person browsing as a guest on this phone starts clean
      favoritesStore = favoritesStore.filter((k) => !k.startsWith('guest_device:::'));
      try {
        await storage.saveFavorites(favoritesStore);
      } catch (_e) {}
    }
  },

  // Moderate listing (Admin only)
  async moderateProduct(productId, action, reason) {
    const index = productsStore.findIndex((p) => p.id === productId);
    if (index === -1) throw new Error('Không tìm thấy sản phẩm');

    const changes = { updatedAt: new Date().toISOString() };
    if (action === 'approve') {
      // A listing with no stock left goes back to sold_out, not active
      changes.status = productsStore[index].stockQuantity > 0 ? 'active' : 'sold_out';
      changes.hiddenBy = null;
      changes.hiddenReason = null;
      changes.rejectionReason = null;
    } else if (action === 'reject') {
      changes.status = 'rejected';
      changes.rejectionReason = reason;
    } else if (action === 'hide') {
      changes.status = 'hidden';
      changes.hiddenBy = 'admin';
      changes.hiddenReason = reason;
    } else {
      throw new Error('Thao tác kiểm duyệt không hợp lệ');
    }

    if (isLiveFirebase && db) {
      // The decision must reach Firestore, otherwise only the admin's phone sees it
      await updateDoc(doc(db, 'products', productId), changes);
    }
    productsStore[index] = { ...productsStore[index], ...changes };

    const product = productsStore[index];
    const notice = MODERATION_NOTICES[action];
    await notificationService.createNotification({
      recipientId: product.sellerId,
      type: notice.type,
      title: notice.title,
      body:
        action === 'approve'
          ? `Tin "${product.name}" đã hiển thị công khai trên ReMarket.`
          : `Tin "${product.name}" - Lý do: ${reason || 'Vi phạm tiêu chuẩn cộng đồng'}`,
      data: { productId },
    });

    return deepClone(product);
  },

  // Apply stock changes atomically against Firestore (no-op in offline/demo mode).
  // Each change: { productId, productName, delta, reservedDelta?, expectedPrice? }
  //   delta < 0 reserves stock (checkout), delta > 0 restores it (reject/cancel);
  //   reservedDelta defaults to -delta (shipping passes delta 0, reservedDelta -qty);
  //   expectedPrice rejects the checkout if the seller changed the price meanwhile.
  // orderDoc, when given, is written in the same transaction so stock is never
  // reserved without the order that reserved it.
  // Returns { [productId]: { stockQuantity, reservedQuantity, status } } for the docs it
  // updated, or null when Firestore was not reached. OUT_OF_STOCK / PRICE_CHANGED are
  // rethrown; network failures are logged and ignored so the local store stays usable,
  // matching the fallback behaviour of the other services.
  async applyRemoteStockChanges(changes, { orderDoc } = {}) {
    if (!isLiveFirebase || !db || changes.length === 0) return null;
    try {
      return await runTransaction(db, async (tx) => {
        const refs = changes.map((c) => doc(db, 'products', c.productId));
        const snaps = [];
        for (const ref of refs) snaps.push(await tx.get(ref));

        snaps.forEach((snap, i) => {
          if (!snap.exists()) return; // listing only exists locally
          const data = snap.data();
          const { delta, productName, expectedPrice } = changes[i];
          if (expectedPrice != null && data.price !== expectedPrice) {
            throw checkoutError(
              'PRICE_CHANGED',
              `Giá "${data.name || productName}" vừa thay đổi thành ${Number(data.price).toLocaleString('vi-VN')} ₫`
            );
          }
          if (delta < 0 && (data.status !== 'active' || data.stockQuantity < -delta)) {
            throw checkoutError(
              'OUT_OF_STOCK',
              `Sản phẩm "${data.name || productName}" chỉ còn ${data.stockQuantity} món, không đủ số lượng bạn yêu cầu`
            );
          }
        });

        const results = {};
        snaps.forEach((snap, i) => {
          if (!snap.exists()) return;
          const data = snap.data();
          const { delta, reservedDelta = -delta } = changes[i];
          const stockQuantity = data.stockQuantity + delta;
          let status = data.status;
          if (stockQuantity <= 0) status = 'sold_out';
          else if (data.status === 'sold_out') status = 'active';
          const next = {
            stockQuantity,
            reservedQuantity: Math.max(0, (data.reservedQuantity || 0) + reservedDelta),
            status,
          };
          tx.update(refs[i], { ...next, updatedAt: new Date().toISOString() });
          results[changes[i].productId] = next;
        });

        if (orderDoc) tx.set(doc(db, 'orders', orderDoc.id), orderDoc);
        return results;
      });
    } catch (err) {
      if (err.code === 'OUT_OF_STOCK' || err.code === 'PRICE_CHANGED') throw err;
      console.warn('⚠️ [Firestore] stock sync failed:', err.message);
      return null;
    }
  },

  // Direct reference to in-memory store for atomic inventory operations
  _getInternalStore() {
    return productsStore;
  },
};
