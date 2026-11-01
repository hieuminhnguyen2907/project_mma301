import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  USER_SESSION: '@remarket_user_session',
  CART: '@remarket_cart',
  RECENTLY_VIEWED: '@remarket_recently_viewed',
  FAVORITES: '@remarket_favorites',
  CHAT_CONVERSATIONS: '@remarket_chat_conversations',
  ORDERS: '@remarket_orders',
  NOTIFICATIONS: '@remarket_notifications',
  WALLETS: '@remarket_wallets',
  REVIEWS: '@remarket_reviews',
  REPORTS: '@remarket_reports',
  RETURN_REQUESTS: '@remarket_return_requests',
};

// In-memory fallback map for Node/test runner environments
const memoryFallback = new Map();

const isNativeStorageAvailable =
  typeof AsyncStorage !== 'undefined' &&
  AsyncStorage &&
  typeof AsyncStorage.getItem === 'function';

export const storage = {
  // Generic JSON persistence for small collections (reviews, reports, return requests)
  async getJSON(key, fallback = null) {
    try {
      const data = isNativeStorageAvailable
        ? await AsyncStorage.getItem(key)
        : memoryFallback.get(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.warn(`Storage read error (${key}):`, e);
      return fallback;
    }
  },

  async setJSON(key, value) {
    try {
      if (isNativeStorageAvailable) {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      } else {
        memoryFallback.set(key, JSON.stringify(value));
      }
    } catch (e) {
      console.error(`Storage write error (${key}):`, e);
    }
  },

  async saveUser(user) {
    try {
      if (isNativeStorageAvailable) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));
      } else {
        memoryFallback.set(STORAGE_KEYS.USER_SESSION, JSON.stringify(user));
      }
    } catch (e) {
      console.error('Failed to save user to storage', e);
    }
  },

  async getUser() {
    try {
      if (!isNativeStorageAvailable) {
        const mem = memoryFallback.get(STORAGE_KEYS.USER_SESSION);
        return mem ? JSON.parse(mem) : null;
      }
      // No timeout race: answering "empty" on a slow read made callers overwrite the
      // saved data (cart, favorites) or treat a signed-in user as logged out
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_SESSION);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Storage getUser error, defaulting to null:', e);
      return null;
    }
  },

  async removeUser() {
    try {
      if (isNativeStorageAvailable) {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      } else {
        memoryFallback.delete(STORAGE_KEYS.USER_SESSION);
      }
    } catch (e) {
      console.error('Failed to remove user from storage', e);
    }
  },

  async saveCart(cartItems) {
    try {
      if (isNativeStorageAvailable) {
        await AsyncStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartItems));
      } else {
        memoryFallback.set(STORAGE_KEYS.CART, JSON.stringify(cartItems));
      }
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  },

  async getCart() {
    try {
      if (!isNativeStorageAvailable) {
        const mem = memoryFallback.get(STORAGE_KEYS.CART);
        return mem ? JSON.parse(mem) : [];
      }
      // No timeout race: answering "empty" on a slow read made callers overwrite the
      // saved data (cart, favorites) or treat a signed-in user as logged out
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Storage getCart error, defaulting to empty:', e);
      return [];
    }
  },

  async saveRecentlyViewed(items) {
    try {
      if (isNativeStorageAvailable) {
        await AsyncStorage.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(items));
      } else {
        memoryFallback.set(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(items));
      }
    } catch (e) {
      console.error('Failed to save recently viewed to storage', e);
    }
  },

  async getRecentlyViewed() {
    try {
      const data = isNativeStorageAvailable
        ? await AsyncStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED)
        : memoryFallback.get(STORAGE_KEYS.RECENTLY_VIEWED);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to get recently viewed from storage', e);
      return [];
    }
  },

  async saveFavorites(favorites) {
    try {
      if (isNativeStorageAvailable) {
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      } else {
        memoryFallback.set(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
      }
    } catch (e) {
      console.error('Failed to save favorites to storage', e);
    }
  },

  async getFavorites() {
    try {
      if (!isNativeStorageAvailable) {
        const mem = memoryFallback.get(STORAGE_KEYS.FAVORITES);
        return mem ? JSON.parse(mem) : [];
      }
      // No timeout race: answering "empty" on a slow read made callers overwrite the
      // saved data (cart, favorites) or treat a signed-in user as logged out
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Storage getFavorites error, defaulting to empty:', e);
      return [];
    }
  },

  async saveChatConversations(conversations) {
    try {
      if (isNativeStorageAvailable) {
        await AsyncStorage.setItem(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(conversations));
      } else {
        memoryFallback.set(STORAGE_KEYS.CHAT_CONVERSATIONS, JSON.stringify(conversations));
      }
    } catch (e) {
      console.error('Failed to save chat conversations to storage', e);
    }
  },

  async getChatConversations() {
    try {
      if (!isNativeStorageAvailable) {
        const mem = memoryFallback.get(STORAGE_KEYS.CHAT_CONVERSATIONS);
        return mem ? JSON.parse(mem) : null;
      }
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_CONVERSATIONS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Storage getChatConversations error:', e);
      return null;
    }
  },

  async saveOrders(orders) {
    try {
      if (isNativeStorageAvailable) {
        await AsyncStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      } else {
        memoryFallback.set(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      }
    } catch (e) {
      console.error('Failed to save orders to storage', e);
    }
  },

  async getOrders() {
    try {
      if (!isNativeStorageAvailable) {
        const mem = memoryFallback.get(STORAGE_KEYS.ORDERS);
        return mem ? JSON.parse(mem) : null;
      }
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ORDERS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Storage getOrders error:', e);
      return null;
    }
  },

  async saveNotifications(notifs) {
    try {
      if (isNativeStorageAvailable) {
        await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      } else {
        memoryFallback.set(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
      }
    } catch (e) {
      console.error('Failed to save notifications to storage', e);
    }
  },

  async getNotifications() {
    try {
      if (!isNativeStorageAvailable) {
        const mem = memoryFallback.get(STORAGE_KEYS.NOTIFICATIONS);
        return mem ? JSON.parse(mem) : null;
      }
      const data = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Storage getNotifications error:', e);
      return null;
    }
  },

  async saveWallets(wallets) {
    try {
      if (isNativeStorageAvailable) {
        await AsyncStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
      } else {
        memoryFallback.set(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
      }
    } catch (e) {
      console.error('Failed to save wallets to storage', e);
    }
  },

  async getWallets() {
    try {
      if (!isNativeStorageAvailable) {
        const mem = memoryFallback.get(STORAGE_KEYS.WALLETS);
        return mem ? JSON.parse(mem) : null;
      }
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WALLETS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Storage getWallets error:', e);
      return null;
    }
  },
};
