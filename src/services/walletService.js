import { orderService } from './orderService.js';
import { storage } from '../utils/storage.js';
import { db, isLiveFirebase } from '../config/firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const DEFAULT_WALLETS = {
  user_seller_nam: {
    userId: 'user_seller_nam',
    availableBalance: 8750000,
    pendingSettlement: 3825000,
    transactions: [
      {
        id: 'tx_01',
        type: 'COD_PROCEEDS',
        amount: 8750000,
        description: 'Thu hộ COD hoàn tất đơn hàng RM-20261025-081',
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
      {
        id: 'tx_02',
        type: 'WITHDRAWAL',
        amount: -5000000,
        description: 'Rút tiền về Vietcombank ****8921',
        timestamp: new Date(Date.now() - 86400000 * 6).toISOString(),
      },
    ],
  },
};

let walletsStore = { ...DEFAULT_WALLETS };
let hasHydrated = false;

// Concurrent first calls share one load; otherwise a late-finishing read could replace
// the store with stale data and drop records written in between
let hydrationPromise = null;
const hydrateWallets = () => {
  if (!hydrationPromise) hydrationPromise = hydrateWalletsOnce();
  return hydrationPromise;
};

const hydrateWalletsOnce = async () => {
  if (hasHydrated) return;
  try {
    const saved = await storage.getWallets();
    if (saved && typeof saved === 'object') {
      walletsStore = { ...DEFAULT_WALLETS, ...saved };
    }
  } catch (err) {
    console.warn('Wallets hydration fallback:', err);
  } finally {
    hasHydrated = true;
  }
};

const persistWallet = async (userId) => {
  try {
    await storage.saveWallets(walletsStore);
    if (isLiveFirebase && db && walletsStore[userId]) {
      setDoc(doc(db, 'wallets', userId), walletsStore[userId], { merge: true }).catch(() => {});
    }
  } catch (err) {
    console.warn('Persist wallet error:', err);
  }
};

const applyCredit = (wallet, amount, orderId, orderLabel) => {
  wallet.creditedOrderIds = wallet.creditedOrderIds || [];
  if (wallet.creditedOrderIds.includes(orderId)) return false;
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) return false;

  wallet.creditedOrderIds.push(orderId);
  wallet.availableBalance = (Number(wallet.availableBalance) || 0) + numAmount;
  wallet.transactions = wallet.transactions || [];
  wallet.transactions.unshift({
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'COD_PROCEEDS',
    amount: numAmount,
    orderId,
    description: `Thu hộ COD hoàn tất đơn hàng ${orderLabel}`,
    timestamp: new Date().toISOString(),
  });
  return true;
};

export const walletService = {
  // Get wallet overview. COD proceeds are credited here, on the seller's own device,
  // from the seller's COMPLETED orders (each order exactly once). Crediting from the
  // buyer's phone would need write access to someone else's wallet.
  async getWallet(userId) {
    await hydrateWallets();
    await new Promise((resolve) => setTimeout(resolve, 200));

    if (isLiveFirebase && db) {
      try {
        const snap = await getDoc(doc(db, 'wallets', userId));
        if (snap.exists()) {
          walletsStore[userId] = snap.data();
          await storage.saveWallets(walletsStore);
        }
      } catch (err) {}
    }

    if (!walletsStore[userId]) {
      walletsStore[userId] = {
        userId,
        availableBalance: 0,
        pendingSettlement: 0,
        transactions: [],
        creditedOrderIds: [],
      };
    }
    const wallet = walletsStore[userId];

    const allSellerOrders = await orderService.getSellerOrders(userId);

    // Release the goods value of every completed COD order not credited yet
    allSellerOrders
      .filter((o) => o.status === 'COMPLETED')
      .forEach((o) => applyCredit(wallet, o.subtotal, o.id, o.orderNumber));

    // Orders the seller accepted but the buyer has not paid for yet
    wallet.pendingSettlement = allSellerOrders
      .filter((o) => o.status === 'CONFIRMED' || o.status === 'SHIPPING')
      .reduce((sum, o) => sum + o.subtotal, 0);

    await persistWallet(userId);
    return wallet;
  },

  // Credit COD proceeds of one order (idempotent: an order is never paid out twice)
  async creditPendingCOD(userId, amount, orderId, orderLabel = orderId) {
    const wallet = await this.getWallet(userId);
    if (applyCredit(wallet, amount, orderId, orderLabel)) {
      await persistWallet(userId);
    }
    return wallet;
  },

  // Request withdrawal to bank account
  async requestWithdrawal({ userId, sellerId, amount, bankName, accountNumber, accountHolder }) {
    await hydrateWallets();
    await new Promise((resolve) => setTimeout(resolve, 300));

    const targetUserId = userId || sellerId;
    const wallet = await this.getWallet(targetUserId);
    const numAmount = Number(amount);
    const cleanAccount = String(accountNumber || '').replace(/\s/g, '');
    const cleanHolder = String(accountHolder || '').trim();

    if (!bankName || !cleanAccount || !cleanHolder) {
      throw new Error('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng thụ hưởng');
    }

    if (!/^\d{6,20}$/.test(cleanAccount)) {
      throw new Error('Số tài khoản ngân hàng chỉ gồm 6-20 chữ số');
    }

    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      throw new Error('Số tiền rút phải lớn hơn 0 đồng');
    }

    if (numAmount > wallet.availableBalance) {
      throw new Error(`Số dư khả dụng hiện tại (${wallet.availableBalance.toLocaleString('vi-VN')} ₫) không đủ để rút`);
    }

    // Hold the amount: the payout itself is made by the platform's finance team,
    // so the request is recorded as pending rather than reported as already paid
    wallet.availableBalance -= numAmount;

    const newTx = {
      id: `tx_${Date.now()}`,
      type: 'WITHDRAWAL',
      status: 'PENDING',
      amount: -numAmount,
      description: `Yêu cầu rút về ${bankName} (****${cleanAccount.slice(-4)}) - đang xử lý`,
      bankDetails: { bankName, accountNumber: cleanAccount, accountHolder: cleanHolder },
      timestamp: new Date().toISOString(),
    };

    wallet.transactions.unshift(newTx);
    await persistWallet(targetUserId);
    return newTx;
  },
};
