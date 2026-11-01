import { orderService } from './orderService.js';
import { authService } from './authService.js';
import { storage, STORAGE_KEYS } from '../utils/storage.js';
import { db, isLiveFirebase } from '../config/firebase.js';
import { doc, getDoc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

const DEFAULT_REVIEWS = [
  {
    id: 'rev_01',
    orderId: 'order_completed_sample',
    sellerId: 'user_seller_nam',
    buyerId: 'user_buyer_linh',
    buyerName: 'Trần Thảo Linh',
    buyerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    rating: 5,
    comment: 'Sản phẩm nguyên vẹn, tình trạng đúng như mô tả và hình ảnh. Người bán đóng gói rất cẩn thận!',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

let reviewsStore = [...DEFAULT_REVIEWS];

// Reviews are persisted: a review must survive an app restart, otherwise the duplicate
// check and the seller's average would be computed from whatever is left in memory
let hydrationPromise = null;
const hydrateReviews = () => {
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      const saved = await storage.getJSON(STORAGE_KEYS.REVIEWS, null);
      if (Array.isArray(saved) && saved.length > 0) {
        const map = new Map();
        DEFAULT_REVIEWS.forEach((r) => map.set(r.orderId, r));
        saved.forEach((r) => map.set(r.orderId, r));
        reviewsStore = Array.from(map.values());
      }
    })();
  }
  return hydrationPromise;
};

const persistReviews = () => storage.setJSON(STORAGE_KEYS.REVIEWS, reviewsStore);

// All reviews of a seller: Firestore is the shared source when reachable
const loadSellerReviews = async (sellerId) => {
  await hydrateReviews();
  if (isLiveFirebase && db) {
    try {
      const snap = await getDocs(query(collection(db, 'reviews'), where('sellerId', '==', sellerId)));
      const map = new Map();
      reviewsStore.forEach((r) => map.set(r.orderId, r));
      snap.docs.forEach((d) => map.set(d.id, { id: d.id, ...d.data() }));
      reviewsStore = Array.from(map.values());
      await persistReviews();
    } catch (err) {
      console.warn('⚠️ [Firestore] seller reviews fallback:', err.message);
    }
  }
  return reviewsStore.filter((r) => r.sellerId === sellerId);
};

export const reviewService = {
  // Get reviews for a specific seller
  async getSellerReviews(sellerId) {
    const list = await loadSellerReviews(sellerId);
    return [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Submit review for an order
  async submitReview({ orderId, rating, comment, buyer }) {
    await hydrateReviews();

    const numericRating = Math.round(Number(rating));
    if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
      throw new Error('Vui lòng chọn từ 1 đến 5 sao');
    }
    const cleanComment = String(comment || '').trim();
    if (cleanComment.length < 10 || cleanComment.length > 500) {
      throw new Error('Nhận xét phải có từ 10 đến 500 ký tự');
    }

    // 1. Fetch order
    const order = await orderService.getOrderById(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng tương ứng');

    // 2. Validate order status
    if (order.status !== 'COMPLETED') {
      throw new Error('Chỉ có thể đánh giá người bán sau khi đơn hàng đã hoàn tất giao dịch');
    }

    // 3. Validate actor
    if (order.buyerId !== buyer.uid) {
      throw new Error('Chỉ người mua của đơn hàng này mới có quyền đánh giá');
    }

    if (order.sellerId === buyer.uid) {
      throw new Error('Bạn không thể tự đánh giá chính mình');
    }

    // 4. Exactly one review per order (checked on the order flag, the local copy and
    // Firestore, so a reinstall or a second device cannot add another)
    const duplicateMessage = 'Đơn hàng này đã được bạn gửi đánh giá trước đó';
    if (order.isReviewed || reviewsStore.some((r) => r.orderId === orderId)) {
      throw new Error(duplicateMessage);
    }
    if (isLiveFirebase && db) {
      const existing = await getDoc(doc(db, 'reviews', orderId)).catch(() => null);
      if (existing?.exists()) throw new Error(duplicateMessage);
    }

    const newReview = {
      id: orderId,
      orderId,
      sellerId: order.sellerId,
      buyerId: buyer.uid,
      buyerName: buyer.displayName,
      buyerAvatar: buyer.avatarUrl || null,
      rating: numericRating,
      comment: cleanComment,
      createdAt: new Date().toISOString(),
    };

    if (isLiveFirebase && db) {
      // Document id = orderId: the security rules then guarantee one review per order
      await setDoc(doc(db, 'reviews', orderId), newReview);
    }

    reviewsStore.unshift(newReview);
    await persistReviews();
    await orderService.markReviewed(orderId);

    // Recalculate the seller's average from every review of that seller
    const allSellerReviews = await loadSellerReviews(order.sellerId);
    const sum = allSellerReviews.reduce((acc, curr) => acc + Number(curr.rating || 0), 0);
    const avg = Number((sum / allSellerReviews.length).toFixed(1));

    await authService.updateProfile(order.sellerId, {
      ratingAverage: avg,
      ratingCount: allSellerReviews.length,
    });

    return newReview;
  },
};
