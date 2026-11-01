import { storage } from '../utils/storage.js';
import { db, isLiveFirebase } from '../config/firebase.js';
import { doc, setDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';

// In-app Notifications Service for ReMarket with AsyncStorage & Firestore Dual-Mode
const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif_01',
    recipientId: 'user_buyer_linh',
    type: 'ORDER_CREATED',
    title: 'Đặt hàng thành công!',
    body: 'Đơn hàng RM-20261028-101 của bạn đã được gửi tới người bán Nguyễn Văn Nam.',
    data: { orderId: 'order_demo_101' },
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'notif_02',
    recipientId: 'user_seller_nam',
    type: 'ORDER_CREATED',
    title: 'Đơn hàng mới chờ xác nhận',
    body: 'Khách hàng Trần Thảo Linh vừa đặt mua Tai nghe Sony WH-1000XM4.',
    data: { orderId: 'order_demo_101' },
    isRead: false,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
];

let notificationsStore = [...DEFAULT_NOTIFICATIONS];
let hasHydrated = false;

// Concurrent first calls share one load; otherwise a late-finishing read could replace
// the store with stale data and drop records written in between
let hydrationPromise = null;
const hydrateNotifications = () => {
  if (!hydrationPromise) hydrationPromise = hydrateNotificationsOnce();
  return hydrationPromise;
};

const hydrateNotificationsOnce = async () => {
  if (hasHydrated) return;
  try {
    const saved = await storage.getNotifications();
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const notifMap = new Map();
      DEFAULT_NOTIFICATIONS.forEach((n) => notifMap.set(n.id, n));
      saved.forEach((n) => notifMap.set(n.id, n));
      notificationsStore = Array.from(notifMap.values());
    }
  } catch (err) {
    console.warn('Notifications hydration fallback:', err);
  } finally {
    hasHydrated = true;
  }
};

const persistNotifications = async () => {
  try {
    await storage.saveNotifications(notificationsStore);
  } catch (err) {
    console.warn('Persist notifications error:', err);
  }
};

const syncReadFlag = (notificationId) => {
  if (!isLiveFirebase || !db) return;
  updateDoc(doc(db, 'notifications', notificationId), { isRead: true }).catch((err) => {
    console.warn('⚠️ [Firestore] mark notification read failed:', err.message);
  });
};

export const notificationService = {
  async getNotifications(userId) {
    await hydrateNotifications();

    if (isLiveFirebase && db) {
      try {
        const q = query(collection(db, 'notifications'), where('recipientId', '==', userId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const remoteNotifs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          const notifMap = new Map();
          notificationsStore.forEach((n) => notifMap.set(n.id, n));
          remoteNotifs.forEach((n) => {
            // A read made on this device may not have reached Firestore yet: never let
            // the remote copy flip it back to unread
            const local = notifMap.get(n.id);
            notifMap.set(n.id, { ...n, isRead: Boolean(n.isRead || local?.isRead) });
          });
          notificationsStore = Array.from(notifMap.values());
          await persistNotifications();
        }
      } catch (err) {
        // Fallback to local store
      }
    }

    return notificationsStore
      .filter((n) => n.recipientId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((n) => ({ ...n, data: { ...n.data } }));
  },

  async markAsRead(notificationId) {
    await hydrateNotifications();
    const notif = notificationsStore.find((n) => n.id === notificationId);
    if (notif) {
      notif.isRead = true;
      await persistNotifications();

      syncReadFlag(notificationId);
    }
    return true;
  },

  async markAllAsRead(userId) {
    await hydrateNotifications();
    notificationsStore.forEach((n) => {
      if (n.recipientId === userId && !n.isRead) {
        n.isRead = true;
        syncReadFlag(n.id);
      }
    });
    await persistNotifications();
    return true;
  },

  async createNotification({ recipientId, type, title, body, data }) {
    await hydrateNotifications();
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recipientId,
      type,
      title,
      body,
      data: data || {},
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    notificationsStore.unshift(newNotif);
    await persistNotifications();

    if (isLiveFirebase && db) {
      try {
        setDoc(doc(db, 'notifications', newNotif.id), newNotif).catch(() => {});
      } catch (err) {}
    }

    return newNotif;
  },
};
