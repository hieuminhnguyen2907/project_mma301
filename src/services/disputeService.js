import { storage, STORAGE_KEYS } from '../utils/storage.js';
import { db, isLiveFirebase } from '../config/firebase.js';
import { doc, setDoc, updateDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { orderService } from './orderService.js';
import { notificationService } from './notificationService.js';

const DEFAULT_REPORTS = [
  {
    id: 'rep_01',
    reporterId: 'user_buyer_linh',
    reporterName: 'Trần Thảo Linh',
    targetType: 'product',
    targetId: 'prod_01',
    targetName: 'iPhone 13 128GB Midnight',
    reason: 'misleading_condition',
    reasonLabel: 'Thông tin tình trạng sai lệch',
    description: 'Nghi vấn số lần sạc pin không đúng với thực tế sử dụng',
    evidenceImages: [],
    status: 'pending',
    adminDecision: null,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export const REPORT_REASON_LABELS = {
  misleading_condition: 'Thông tin tình trạng sai lệch / che giấu lỗi',
  counterfeit: 'Hàng giả / Nhái / Không rõ nguồn gốc',
  prohibited_item: 'Hàng cấm mua bán theo quy định pháp luật',
  scam_behavior: 'Có dấu hiệu lừa đảo / ép chuyển khoản ngoài app',
  other: 'Lý do khác',
};

export const RETURN_REASON_LABELS = {
  defect_not_declared: 'Hàng có lỗi nặng nhưng không được khai báo',
  wrong_item: 'Giao sai sản phẩm / Thiếu phụ kiện cam kết',
  damaged_in_transit: 'Hàng bị hư hỏng do vận chuyển',
  not_as_described: 'Tình trạng thực tế khác xa bản khai báo',
};

// A complaint can be opened within this window after the buyer confirms receipt
export const RETURN_WINDOW_DAYS = 7;

let reportsStore = [...DEFAULT_REPORTS];
let returnsStore = [];

let hydrationPromise = null;
const hydrate = () => {
  if (!hydrationPromise) {
    hydrationPromise = (async () => {
      const [savedReports, savedReturns] = await Promise.all([
        storage.getJSON(STORAGE_KEYS.REPORTS, null),
        storage.getJSON(STORAGE_KEYS.RETURN_REQUESTS, null),
      ]);
      if (Array.isArray(savedReports)) reportsStore = mergeById(DEFAULT_REPORTS, savedReports);
      if (Array.isArray(savedReturns)) returnsStore = savedReturns;
    })();
  }
  return hydrationPromise;
};

const mergeById = (base, incoming) => {
  const map = new Map();
  base.forEach((x) => map.set(x.id, x));
  incoming.forEach((x) => map.set(x.id, x));
  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

const persist = () =>
  Promise.all([
    storage.setJSON(STORAGE_KEYS.REPORTS, reportsStore),
    storage.setJSON(STORAGE_KEYS.RETURN_REQUESTS, returnsStore),
  ]);

const fetchRemote = async (collectionName, constraint) => {
  if (!isLiveFirebase || !db) return null;
  try {
    const ref = collection(db, collectionName);
    const snap = await getDocs(constraint ? query(ref, constraint) : ref);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn(`⚠️ [Firestore] ${collectionName} fallback:`, err.message);
    return null;
  }
};

const writeRemote = async (collectionName, record) => {
  if (!isLiveFirebase || !db) return;
  await setDoc(doc(db, collectionName, record.id), record);
};

const updateRemote = async (collectionName, id, changes) => {
  if (!isLiveFirebase || !db) return;
  await updateDoc(doc(db, collectionName, id), changes);
};

const findReturnForOrder = async (orderId) => {
  const local = returnsStore.find((r) => r.orderId === orderId);
  if (local) return local;
  const remote = await fetchRemote('return_requests', where('orderId', '==', orderId));
  return remote?.[0] || null;
};

export const disputeService = {
  // Submit a report for a product or seller
  async submitReport({ reporter, targetType, targetId, targetName, targetOwnerId, reason, description, evidenceImages = [] }) {
    await hydrate();
    if (!reporter?.uid) throw new Error('Vui lòng đăng nhập để gửi báo cáo');
    if (!targetId) throw new Error('Không xác định được đối tượng bị báo cáo');
    if (targetOwnerId && targetOwnerId === reporter.uid) {
      throw new Error('Bạn không thể báo cáo tin đăng của chính mình');
    }
    const cleanDescription = String(description || '').trim();
    if (cleanDescription.length < 15) {
      throw new Error('Vui lòng mô tả chi tiết vi phạm tối thiểu 15 ký tự');
    }
    const duplicate = reportsStore.find(
      (r) => r.reporterId === reporter.uid && r.targetId === targetId && r.status === 'pending'
    );
    if (duplicate) {
      throw new Error('Bạn đã báo cáo nội dung này và quản trị viên đang xem xét');
    }

    const newReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      reporterId: reporter.uid,
      reporterName: reporter.displayName,
      targetType,
      targetId,
      targetName: targetName || 'Sản phẩm',
      reason,
      reasonLabel: REPORT_REASON_LABELS[reason] || reason,
      description: cleanDescription,
      evidenceImages,
      status: 'pending',
      adminDecision: null,
      createdAt: new Date().toISOString(),
    };

    await writeRemote('reports', newReport);
    reportsStore.unshift(newReport);
    await persist();
    return newReport;
  },

  // Submit return request or complaint for an order
  async submitReturnRequest({ order: orderParam, buyer, reason, explanation, evidenceImages = [] }) {
    await hydrate();
    if (!buyer?.uid) throw new Error('Vui lòng đăng nhập để gửi yêu cầu');

    // Validate against the current order, not the snapshot the screen was opened with
    const order = await orderService.getOrderById(orderParam.id);
    if (order.buyerId !== buyer.uid) {
      throw new Error('Chỉ người mua của đơn hàng mới được gửi yêu cầu trả hàng');
    }
    if (order.status !== 'COMPLETED') {
      throw new Error('Chỉ gửi được yêu cầu trả hàng sau khi đã nhận hàng');
    }
    const completedStep = [...(order.statusHistory || [])].reverse().find((s) => s.newStatus === 'COMPLETED');
    const completedAt = new Date(completedStep?.timestamp || order.updatedAt).getTime();
    if (Date.now() - completedAt > RETURN_WINDOW_DAYS * 86400000) {
      throw new Error(`Đã quá ${RETURN_WINDOW_DAYS} ngày kể từ khi nhận hàng, không thể gửi yêu cầu trả hàng`);
    }
    const cleanExplanation = String(explanation || '').trim();
    if (cleanExplanation.length < 15) {
      throw new Error('Vui lòng mô tả chi tiết lý do yêu cầu trả hàng ít nhất 15 ký tự');
    }
    if (!RETURN_REASON_LABELS[reason]) {
      throw new Error('Vui lòng chọn lý do khiếu nại');
    }

    // Check duplicate (one complaint per order)
    if (order.hasDispute || (await findReturnForOrder(order.id))) {
      throw new Error('Đơn hàng này đã có khiếu nại đang được xử lý');
    }

    const newReturn = {
      id: `ret_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerId: buyer.uid,
      buyerName: buyer.displayName,
      sellerId: order.sellerId,
      sellerName: order.sellerName,
      totalAmount: order.totalAmount,
      reason,
      reasonLabel: RETURN_REASON_LABELS[reason],
      explanation: cleanExplanation,
      evidenceImages,
      status: 'submitted',
      adminResolution: null,
      createdAt: new Date().toISOString(),
    };

    await writeRemote('return_requests', newReturn);
    returnsStore.unshift(newReturn);
    await persist();
    await orderService.markDisputed(order.id, true);

    await notificationService.createNotification({
      recipientId: order.sellerId,
      type: 'DISPUTE_UPDATE',
      title: 'Người mua gửi yêu cầu trả hàng',
      body: `Đơn ${order.orderNumber}: ${newReturn.reasonLabel}. Quản trị viên ReMarket sẽ xem xét.`,
      data: { orderId: order.id },
    });

    return newReturn;
  },

  // Admin: Get all reports
  async getAllReports() {
    await hydrate();
    const remote = await fetchRemote('reports');
    if (remote) {
      reportsStore = mergeById(reportsStore, remote);
      await persist();
    }
    return [...reportsStore];
  },

  // Admin: Get all return requests
  async getAllReturnRequests() {
    await hydrate();
    const remote = await fetchRemote('return_requests');
    if (remote) {
      returnsStore = mergeById(returnsStore, remote);
      await persist();
    }
    return [...returnsStore];
  },

  // Admin resolves report. actionTaken: 'dismissed' | 'listing_hidden'
  async resolveReport(reportId, actionTaken, adminNote, adminId) {
    await hydrate();
    const report = reportsStore.find((r) => r.id === reportId);
    if (!report) throw new Error('Không tìm thấy báo cáo');
    if (report.status !== 'pending') throw new Error('Báo cáo này đã được xử lý');

    const changes = {
      status: actionTaken === 'dismissed' ? 'dismissed' : 'resolved',
      adminDecision: {
        adminId,
        actionTaken,
        note: adminNote,
        decidedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    await updateRemote('reports', reportId, changes);
    Object.assign(report, changes);
    await persist();

    await notificationService.createNotification({
      recipientId: report.reporterId,
      type: 'DISPUTE_UPDATE',
      title: 'Báo cáo vi phạm đã được xử lý',
      body:
        actionTaken === 'dismissed'
          ? `Báo cáo về "${report.targetName}" chưa đủ căn cứ vi phạm.`
          : `Cảm ơn bạn! "${report.targetName}" đã bị tạm ẩn do vi phạm.`,
      data: {},
    });

    return report;
  },

  // Admin resolves return request. decision: 'approved' | 'rejected'
  async resolveReturnRequest(returnId, decision, note, adminId) {
    await hydrate();
    if (decision !== 'approved' && decision !== 'rejected') {
      throw new Error('Quyết định xử lý không hợp lệ');
    }
    const ret = returnsStore.find((r) => r.id === returnId);
    if (!ret) throw new Error('Không tìm thấy yêu cầu');
    if (ret.status !== 'submitted' && ret.status !== 'under_review') {
      throw new Error('Yêu cầu này đã được xử lý');
    }

    const changes = {
      status: decision,
      adminResolution: {
        adminId,
        decision: decision === 'approved' ? 'refund_approved' : 'dispute_rejected',
        explanation: note,
        resolvedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    await updateRemote('return_requests', returnId, changes);
    Object.assign(ret, changes);
    await persist();

    const verdict =
      decision === 'approved'
        ? 'được CHẤP NHẬN: người mua gửi trả hàng và được hoàn tiền'
        : 'bị TỪ CHỐI do chưa đủ căn cứ';
    for (const recipientId of [ret.buyerId, ret.sellerId]) {
      await notificationService.createNotification({
        recipientId,
        type: 'DISPUTE_UPDATE',
        title: 'Kết quả xử lý khiếu nại',
        body: `Yêu cầu trả hàng đơn ${ret.orderNumber} ${verdict}. ${note || ''}`.trim(),
        data: { orderId: ret.orderId },
      });
    }

    return ret;
  },
};
