import { MOCK_ORDERS } from './mockData.js';
import { ORDER_STATUS, canTransitionOrder } from '../constants/orderStatus.js';
import { productService } from './productService.js';
import { cartService } from './cartService.js';
import { notificationService } from './notificationService.js';
import { deepClone } from '../utils/clone.js';
import { calculateDeliveryFee } from '../utils/shipping.js';
import { storage } from '../utils/storage.js';
import { db, isLiveFirebase } from '../config/firebase.js';
import { doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';

let ordersStore = deepClone(MOCK_ORDERS);
let hasHydrated = false;

// Concurrent first calls share one load; otherwise a late-finishing read could replace
// the store with stale data and drop records written in between
let hydrationPromise = null;
const hydrateOrders = () => {
  if (!hydrationPromise) hydrationPromise = hydrateOrdersOnce();
  return hydrationPromise;
};

const hydrateOrdersOnce = async () => {
  if (hasHydrated) return;
  try {
    const saved = await storage.getOrders();
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const orderMap = new Map();
      deepClone(MOCK_ORDERS).forEach((o) => orderMap.set(o.id, o));
      saved.forEach((o) => orderMap.set(o.id, o));
      ordersStore = Array.from(orderMap.values());
    }
  } catch (err) {
    console.warn('Orders hydration fallback:', err);
  } finally {
    hasHydrated = true;
  }
};

const persistOrder = async (order) => {
  try {
    await storage.saveOrders(ordersStore);
    if (isLiveFirebase && db && order && order.id) {
      setDoc(doc(db, 'orders', order.id), order, { merge: true }).catch((err) => {
        console.warn('Firestore order sync fallback:', err.message);
      });
    }
  } catch (err) {
    console.warn('Persist order error:', err);
  }
};

// Merge remote orders into the local store (remote wins: it is the shared copy)
const mergeOrders = async (remoteOrders) => {
  const orderMap = new Map();
  ordersStore.forEach((o) => orderMap.set(o.id, o));
  remoteOrders.forEach((o) => orderMap.set(o.id, o));
  ordersStore = Array.from(orderMap.values());
  await storage.saveOrders(ordersStore);
};

// Find an order locally, else fetch it from Firestore (e.g. a seller opening a
// notification for an order placed on the buyer's phone)
const findOrder = async (orderId) => {
  let order = ordersStore.find((o) => o.id === orderId);
  if (!order && isLiveFirebase && db) {
    try {
      const snap = await getDoc(doc(db, 'orders', orderId));
      if (snap.exists()) {
        await mergeOrders([{ id: snap.id, ...snap.data() }]);
        order = ordersStore.find((o) => o.id === orderId);
      }
    } catch (err) {
      console.warn('⚠️ [Firestore] order lookup failed:', err.message);
    }
  }
  return order || null;
};

// Put reserved units back into local stock (seller reject / buyer cancel)
const restoreLocalStock = (items) => {
  const products = productService._getInternalStore();
  for (const item of items) {
    const prod = products.find((p) => p.id === item.productId);
    if (prod) {
      prod.stockQuantity += item.quantity;
      prod.reservedQuantity = Math.max(0, (prod.reservedQuantity || 0) - item.quantity);
      if (prod.status === 'sold_out' && prod.stockQuantity > 0) {
        prod.status = 'active';
      }
    }
  }
};

// Checkout attempts in flight or completed, keyed by checkoutId (double-tap guard)
const pendingCheckouts = new Map();

const checkoutError = (code, message) => {
  const err = new Error(message);
  err.code = code;
  return err;
};

// Unique across devices: the old `RM-<year><last 6 digits of Date.now()>` repeated
// every ~16.7 minutes, and `order_<ms>` could collide between two buyers
const randomSuffix = (length) =>
  Array.from({ length }, () => Math.floor(Math.random() * 36).toString(36)).join('').toUpperCase();

const generateOrderIdentity = () => {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const suffix = randomSuffix(6);
  return { id: `order_${now.getTime()}_${suffix.toLowerCase()}`, orderNumber: `RM-${ymd}-${suffix}` };
};

const createOrderOnce = async ({ buyer, items, deliveryAddress, notes = '' }) => {
  await hydrateOrders();
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!items || items.length === 0) {
    throw new Error('Giỏ hàng không có sản phẩm nào');
  }

  if (!deliveryAddress || !deliveryAddress.street || !deliveryAddress.phoneNumber) {
    throw new Error('Vui lòng chọn địa chỉ nhận hàng hợp lệ');
  }

  // 1. Enforce 1-seller checkout rule
  const firstSellerId = items[0].sellerId;
  const isSingleSeller = items.every((i) => i.sellerId === firstSellerId);
  if (!isSingleSeller) {
    throw new Error('Chỉ được thanh toán đơn hàng từ một người bán duy nhất');
  }

  // Prevent buying own listing
  if (firstSellerId === buyer.uid) {
    throw new Error('Bạn không thể mua sản phẩm của chính mình');
  }

  const products = productService._getInternalStore();

  // 2. ATOMIC PRECONDITION: verify stock availability and the price the buyer saw
  const lines = items.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    if (!prod) {
      throw new Error(`Sản phẩm "${item.productName}" không còn tồn tại`);
    }
    if (prod.sellerId !== firstSellerId) {
      throw new Error(`Sản phẩm "${prod.name}" không thuộc người bán của đơn hàng này`);
    }
    if (prod.status !== 'active') {
      throw new Error(`Sản phẩm "${prod.name}" không còn khả dụng để mua`);
    }
    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new Error(`Số lượng của "${prod.name}" không hợp lệ`);
    }
    if (prod.stockQuantity < quantity) {
      throw new Error(
        `Sản phẩm "${prod.name}" chỉ còn ${prod.stockQuantity} món, không đủ ${quantity} món bạn yêu cầu`
      );
    }
    if (item.price !== undefined && Number(item.price) !== prod.price) {
      throw checkoutError(
        'PRICE_CHANGED',
        `Giá "${prod.name}" vừa thay đổi từ ${Number(item.price).toLocaleString('vi-VN')} ₫ thành ${prod.price.toLocaleString('vi-VN')} ₫. Vui lòng kiểm tra lại đơn hàng.`
      );
    }
    return { prod, quantity, expectedPrice: item.price !== undefined ? Number(item.price) : undefined };
  });

  // 3. Build the order from validated data (immutable snapshot of price, condition, defects)
  const subtotal = lines.reduce((sum, { prod, quantity }) => sum + prod.price * quantity, 0);
  const deliveryFee = calculateDeliveryFee(lines.map(({ prod }) => prod));
  const totalAmount = subtotal + deliveryFee;
  const { id: orderId, orderNumber } = generateOrderIdentity();
  const now = new Date().toISOString();
  const buyerNote = String(notes || '').trim().slice(0, 300);

  const newOrder = {
    id: orderId,
    orderNumber,
    buyerId: buyer.uid,
    buyerName: buyer.displayName,
    buyerPhone: deliveryAddress.phoneNumber || buyer.phoneNumber || '',
    buyerAddress: deliveryAddress,
    buyerNote,
    sellerId: firstSellerId,
    sellerName: lines[0].prod.sellerName || items[0].sellerName || 'Người bán ReMarket',
    items: lines.map(({ prod, quantity }) => ({
      productId: prod.id,
      productName: prod.name,
      primaryImage: prod.primaryImage,
      price: prod.price,
      quantity,
      categoryName: prod.categoryName,
      conditionSnapshot: {
        overallRating: prod.condition?.overallRating || 'Good',
        workingCondition: prod.condition?.workingCondition || 'Đã kiểm tra',
        batteryHealth: prod.condition?.batteryHealth || null,
        knownDefects: prod.knownDefects || [],
      },
    })),
    subtotal,
    deliveryFee,
    totalAmount,
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    status: ORDER_STATUS.PENDING_CONFIRMATION,
    statusHistory: [
      {
        previousStatus: null,
        newStatus: ORDER_STATUS.PENDING_CONFIRMATION,
        actorId: buyer.uid,
        actorRole: 'buyer',
        timestamp: now,
        reason: 'Người mua đặt hàng qua COD (Thanh toán khi nhận hàng)',
      },
    ],
    isReviewed: false,
    hasDispute: false,
    createdAt: now,
    updatedAt: now,
  };

  // 4. ATOMIC EXECUTION: reserve stock and write the order in one Firestore transaction
  // when live, so a later product refetch cannot resurrect sold units
  const remote = await productService.applyRemoteStockChanges(
    lines.map(({ prod, quantity, expectedPrice }) => ({
      productId: prod.id,
      productName: prod.name,
      delta: -quantity,
      expectedPrice,
    })),
    { orderDoc: newOrder }
  );

  for (const { prod, quantity } of lines) {
    const synced = remote?.[prod.id];
    if (synced) {
      // Firestore is the source of truth when reachable (the local copy may be stale)
      Object.assign(prod, synced);
    } else {
      prod.stockQuantity -= quantity;
      prod.reservedQuantity = (prod.reservedQuantity || 0) + quantity;
      if (prod.stockQuantity <= 0) prod.status = 'sold_out';
    }
  }

  ordersStore.unshift(newOrder);
  await persistOrder(newOrder);

  // Remove only the checked-out items from cart (Buy Now must not wipe the rest)
  await cartService.removeItems(items.map((i) => i.productId));

  // Notify seller of new incoming order
  await notificationService.createNotification({
    recipientId: firstSellerId,
    type: 'ORDER_CREATED',
    title: 'Đơn hàng mới!',
    body: `Khách hàng ${buyer.displayName} vừa đặt đơn ${orderNumber} (${totalAmount.toLocaleString('vi-VN')} ₫)${buyerNote ? ` - Lời nhắn: "${buyerNote}"` : ''}`,
    data: { orderId: newOrder.id },
  });

  return deepClone(newOrder);
};

export const orderService = {
  // ATOMIC CHECKOUT: Create order & reserve inventory atomically.
  // items[].price is the price the buyer saw; a mismatch rejects with PRICE_CHANGED.
  // checkoutId (one per checkout screen visit) makes repeated submits return the same
  // order instead of creating duplicates. The delivery fee is computed here from the
  // products, never taken from the caller.
  createOrder(payload) {
    const { checkoutId } = payload;
    if (checkoutId && pendingCheckouts.has(checkoutId)) {
      return pendingCheckouts.get(checkoutId);
    }
    const promise = createOrderOnce(payload);
    if (checkoutId) {
      pendingCheckouts.set(checkoutId, promise);
      // A failed attempt may be retried with the same checkout id
      promise.catch(() => pendingCheckouts.delete(checkoutId));
    }
    return promise;
  },

  // Seller confirms order
  async confirmOrder(orderId, sellerId) {
    await hydrateOrders();
    const order = await findOrder(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (order.sellerId !== sellerId) {
      throw new Error('Bạn không có quyền thao tác trên đơn hàng này');
    }

    if (!canTransitionOrder(order.status, ORDER_STATUS.CONFIRMED, 'seller')) {
      throw new Error(`Không thể chuyển trạng thái từ ${order.status} sang CONFIRMED`);
    }

    order.status = ORDER_STATUS.CONFIRMED;
    order.statusHistory.push({
      previousStatus: ORDER_STATUS.PENDING_CONFIRMATION,
      newStatus: ORDER_STATUS.CONFIRMED,
      actorId: sellerId,
      actorRole: 'seller',
      timestamp: new Date().toISOString(),
      reason: 'Người bán đã xác nhận đơn hàng và chuẩn bị giao cho bên vận chuyển',
    });
    order.updatedAt = new Date().toISOString();

    await persistOrder(order);

    // Notify buyer
    await notificationService.createNotification({
      recipientId: order.buyerId,
      type: 'ORDER_CONFIRMED',
      title: 'Đơn hàng đã được xác nhận!',
      body: `Người bán ${order.sellerName} đã xác nhận đơn hàng ${order.orderNumber}.`,
      data: { orderId: order.id },
    });

    return deepClone(order);
  },

  // Seller rejects order (restores stock atomically)
  async rejectOrder(orderId, sellerId, reason = 'Hết hàng hoặc không thể giao') {
    await hydrateOrders();
    const order = await findOrder(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (order.sellerId !== sellerId) {
      throw new Error('Bạn không có quyền thao tác trên đơn hàng này');
    }

    if (!canTransitionOrder(order.status, ORDER_STATUS.REJECTED, 'seller')) {
      throw new Error(`Không thể từ chối đơn hàng khi ở trạng thái ${order.status}`);
    }

    // ATOMIC STOCK RESTORATION
    await productService.applyRemoteStockChanges(
      order.items.map((i) => ({ productId: i.productId, productName: i.productName, delta: i.quantity }))
    );
    restoreLocalStock(order.items);

    const previousStatus = order.status;
    order.status = ORDER_STATUS.REJECTED;
    order.rejectionReason = reason;
    order.statusHistory.push({
      previousStatus,
      newStatus: ORDER_STATUS.REJECTED,
      actorId: sellerId,
      actorRole: 'seller',
      timestamp: new Date().toISOString(),
      reason,
    });
    order.updatedAt = new Date().toISOString();

    await persistOrder(order);

    // Notify buyer
    await notificationService.createNotification({
      recipientId: order.buyerId,
      type: 'ORDER_REJECTED',
      title: 'Đơn hàng bị từ chối',
      body: `Đơn ${order.orderNumber} đã bị người bán từ chối với lý do: ${reason}`,
      data: { orderId: order.id },
    });

    return deepClone(order);
  },

  // Buyer cancels order (only permitted while PENDING_CONFIRMATION)
  async cancelOrder(orderId, buyerId, reason = 'Thay đổi ý định mua') {
    await hydrateOrders();
    const order = await findOrder(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (order.buyerId !== buyerId) {
      throw new Error('Bạn không có quyền hủy đơn hàng này');
    }

    if (!canTransitionOrder(order.status, ORDER_STATUS.CANCELLED, 'buyer')) {
      throw new Error('Đơn hàng đã được xác nhận hoặc đang giao, không thể hủy trực tiếp');
    }

    // ATOMIC STOCK RESTORATION
    await productService.applyRemoteStockChanges(
      order.items.map((i) => ({ productId: i.productId, productName: i.productName, delta: i.quantity }))
    );
    restoreLocalStock(order.items);

    const previousStatus = order.status;
    order.status = ORDER_STATUS.CANCELLED;
    order.cancellationReason = reason;
    order.statusHistory.push({
      previousStatus,
      newStatus: ORDER_STATUS.CANCELLED,
      actorId: buyerId,
      actorRole: 'buyer',
      timestamp: new Date().toISOString(),
      reason,
    });
    order.updatedAt = new Date().toISOString();

    await persistOrder(order);

    // Notify seller
    await notificationService.createNotification({
      recipientId: order.sellerId,
      type: 'ORDER_CANCELLED',
      title: 'Đơn hàng đã bị hủy',
      body: `Người mua đã hủy đơn ${order.orderNumber} (Lý do: ${reason})`,
      data: { orderId: order.id },
    });

    return deepClone(order);
  },

  // Seller updates to SHIPPING
  async shipOrder(orderId, sellerId, trackingCode = '') {
    await hydrateOrders();
    const order = await findOrder(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (order.sellerId !== sellerId) {
      throw new Error('Chỉ người bán mới có quyền gửi hàng');
    }

    if (!canTransitionOrder(order.status, ORDER_STATUS.SHIPPING, 'seller')) {
      throw new Error(`Không thể chuyển sang SHIPPING từ trạng thái ${order.status}`);
    }

    // Goods leave the seller: the reserved units are now permanently sold
    await productService.applyRemoteStockChanges(
      order.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        delta: 0,
        reservedDelta: -i.quantity,
      }))
    );
    const products = productService._getInternalStore();
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) prod.reservedQuantity = Math.max(0, (prod.reservedQuantity || 0) - item.quantity);
    }

    order.status = ORDER_STATUS.SHIPPING;
    order.trackingCode = trackingCode || `VNPOST-${Date.now().toString().slice(-6)}`;
    order.statusHistory.push({
      previousStatus: ORDER_STATUS.CONFIRMED,
      newStatus: ORDER_STATUS.SHIPPING,
      actorId: sellerId,
      actorRole: 'seller',
      timestamp: new Date().toISOString(),
      reason: `Đã giao cho đơn vị vận chuyển. Mã vận đơn: ${order.trackingCode}`,
    });
    order.updatedAt = new Date().toISOString();

    await persistOrder(order);

    // Notify buyer
    await notificationService.createNotification({
      recipientId: order.buyerId,
      type: 'ORDER_SHIPPED',
      title: 'Đơn hàng đang được giao!',
      body: `Đơn ${order.orderNumber} đang trên đường giao tới bạn. Mã vận đơn: ${order.trackingCode}`,
      data: { orderId: order.id },
    });

    return deepClone(order);
  },

  // Buyer confirms receipt (COMPLETED)
  async completeOrder(orderId, buyerId) {
    await hydrateOrders();
    const order = await findOrder(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (order.buyerId !== buyerId) {
      throw new Error('Chỉ người mua mới có quyền xác nhận đã nhận hàng');
    }

    if (!canTransitionOrder(order.status, ORDER_STATUS.COMPLETED, 'buyer')) {
      throw new Error('Đơn hàng chưa ở trạng thái đang giao để xác nhận hoàn tất');
    }

    order.status = ORDER_STATUS.COMPLETED;
    order.paymentStatus = 'paid';
    order.statusHistory.push({
      previousStatus: ORDER_STATUS.SHIPPING,
      newStatus: ORDER_STATUS.COMPLETED,
      actorId: buyerId,
      actorRole: 'buyer',
      timestamp: new Date().toISOString(),
      reason: 'Người mua đã nhận hàng nguyên vẹn và thanh toán COD thành công',
    });
    order.updatedAt = new Date().toISOString();

    await persistOrder(order);

    // Notify seller
    await notificationService.createNotification({
      recipientId: order.sellerId,
      type: 'ORDER_COMPLETED',
      title: 'Giao hàng thành công!',
      body: `Đơn ${order.orderNumber} đã hoàn tất. Tiền COD đã được xác nhận thanh toán.`,
      data: { orderId: order.id },
    });

    return deepClone(order);
  },

  // Get orders by buyer
  async getBuyerOrders(buyerId, statusFilter) {
    await hydrateOrders();

    if (isLiveFirebase && db) {
      try {
        const q = query(collection(db, 'orders'), where('buyerId', '==', buyerId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await mergeOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        // Fallback to local store
      }
    }

    let list = ordersStore.filter((o) => o.buyerId === buyerId);
    if (statusFilter && statusFilter !== 'ALL') {
      list = list.filter((o) => o.status === statusFilter);
    }
    return deepClone(list);
  },

  // Get orders by seller
  async getSellerOrders(sellerId, statusFilter) {
    await hydrateOrders();

    if (isLiveFirebase && db) {
      try {
        const q = query(collection(db, 'orders'), where('sellerId', '==', sellerId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await mergeOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        // Fallback to local store
      }
    }

    let list = ordersStore.filter((o) => o.sellerId === sellerId);
    if (statusFilter && statusFilter !== 'ALL') {
      list = list.filter((o) => o.status === statusFilter);
    }
    return deepClone(list);
  },

  // Get single order detail
  async getOrderById(orderId) {
    await hydrateOrders();
    const order = await findOrder(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    return deepClone(order);
  },

  // Flag an order as reviewed (called by reviewService)
  async markReviewed(orderId) {
    await hydrateOrders();
    const order = await findOrder(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    order.isReviewed = true;
    order.updatedAt = new Date().toISOString();
    await persistOrder(order);
    return deepClone(order);
  },

  // Flag an order as having an open return/complaint (called by disputeService)
  async markDisputed(orderId, hasDispute = true) {
    await hydrateOrders();
    const order = await findOrder(orderId);
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    order.hasDispute = hasDispute;
    order.updatedAt = new Date().toISOString();
    await persistOrder(order);
    return deepClone(order);
  },

  // Admin access to all orders
  async getAllOrders() {
    await hydrateOrders();
    if (isLiveFirebase && db) {
      try {
        const snap = await getDocs(collection(db, 'orders'));
        await mergeOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.warn('⚠️ [Firestore] getAllOrders fallback:', err.message);
      }
    }
    return deepClone(ordersStore);
  },
};
