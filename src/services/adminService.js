import { authService } from './authService.js';
import { productService } from './productService.js';
import { orderService } from './orderService.js';
import { disputeService } from './disputeService.js';
import { db, isLiveFirebase } from '../config/firebase.js';
import { doc, setDoc } from 'firebase/firestore';

let moderationLogsStore = [];

export const adminService = {
  // Compute Dashboard Statistics & KPIs
  async getDashboardStats() {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const [users, products, orders, reports, returnRequests] = await Promise.all([
      authService.getAllUsers(),
      productService.getProducts({ includeAllStatuses: true }),
      orderService.getAllOrders(),
      disputeService.getAllReports(),
      disputeService.getAllReturnRequests(),
    ]);

    const activeUsers = users.filter((u) => u.status !== 'suspended').length;
    const suspendedUsers = users.filter((u) => u.status === 'suspended').length;

    const ordersByStatus = {
      PENDING_CONFIRMATION: orders.filter((o) => o.status === 'PENDING_CONFIRMATION').length,
      CONFIRMED: orders.filter((o) => o.status === 'CONFIRMED').length,
      SHIPPING: orders.filter((o) => o.status === 'SHIPPING').length,
      COMPLETED: orders.filter((o) => o.status === 'COMPLETED').length,
      CANCELLED: orders.filter((o) => o.status === 'CANCELLED').length,
      REJECTED: orders.filter((o) => o.status === 'REJECTED').length,
    };

    // Gross Order Value (Total order volume - clearly labeled simulated)
    const grossOrderValue = orders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REJECTED')
      .reduce((acc, curr) => acc + curr.totalAmount, 0);

    return {
      totalUsers: users.length,
      activeUsers,
      suspendedUsers,
      totalListings: products.filter((p) => p.status === 'active' || p.status === 'sold_out').length,
      ordersByStatus,
      totalOrders: orders.length,
      pendingReports: reports.filter((r) => r.status === 'pending').length,
      pendingReturns: returnRequests.filter((r) => r.status === 'submitted').length,
      grossOrderValue,
      isSimulatedData: true,
    };
  },

  // Record an audit log (kept locally and in Firestore moderationLogs)
  async logModerationAction({ adminId, adminEmail, action, targetType, targetId, reason }) {
    const entry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      adminId,
      adminEmail: adminEmail || null,
      action,
      targetType,
      targetId,
      reason: reason || '',
      timestamp: new Date().toISOString(),
    };
    moderationLogsStore.unshift(entry);
    if (isLiveFirebase && db) {
      try {
        await setDoc(doc(db, 'moderationLogs', entry.id), entry);
      } catch (err) {
        console.warn('⚠️ [Firestore] moderation log failed:', err.message);
      }
    }
    return entry;
  },

  getModerationLogs() {
    return [...moderationLogsStore];
  },
};
