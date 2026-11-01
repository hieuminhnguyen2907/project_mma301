// Order Lifecycle Status Definitions & State Machine Rules
export const ORDER_STATUS = {
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  CONFIRMED: 'CONFIRMED',
  SHIPPING: 'SHIPPING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_STATUS_DETAILS = {
  [ORDER_STATUS.PENDING_CONFIRMATION]: {
    label: 'Chờ xác nhận',
    labelEn: 'Pending Confirmation',
    color: '#D97706',
    bgColor: '#FEF3C7',
    description: 'Người bán đang kiểm tra và chuẩn bị xác nhận đơn hàng.',
    allowedTransitions: {
      buyer: [ORDER_STATUS.CANCELLED],
      seller: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.REJECTED],
      admin: [ORDER_STATUS.CANCELLED],
    },
  },
  [ORDER_STATUS.CONFIRMED]: {
    label: 'Đã xác nhận',
    labelEn: 'Confirmed',
    color: '#0F766E',
    bgColor: '#CCFBF1',
    description: 'Người bán đã xác nhận và đang đóng gói sản phẩm.',
    allowedTransitions: {
      buyer: [],
      seller: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
      admin: [ORDER_STATUS.CANCELLED],
    },
  },
  [ORDER_STATUS.SHIPPING]: {
    label: 'Đang vận chuyển',
    labelEn: 'Shipping',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    description: 'Đơn hàng đang trên đường giao đến bạn qua đơn vị vận chuyển.',
    allowedTransitions: {
      buyer: [ORDER_STATUS.COMPLETED],
      seller: [],
      admin: [],
    },
  },
  [ORDER_STATUS.COMPLETED]: {
    label: 'Hoàn tất',
    labelEn: 'Completed',
    color: '#10B981',
    bgColor: '#D1FAE5',
    description: 'Người mua đã nhận hàng và hoàn tất thanh toán COD.',
    allowedTransitions: {
      buyer: [],
      seller: [],
      admin: [],
    },
  },
  [ORDER_STATUS.REJECTED]: {
    label: 'Bị từ chối',
    labelEn: 'Rejected',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    description: 'Người bán đã từ chối đơn hàng (tồn kho đã được khôi phục).',
    allowedTransitions: {
      buyer: [],
      seller: [],
      admin: [],
    },
  },
  [ORDER_STATUS.CANCELLED]: {
    label: 'Đã hủy',
    labelEn: 'Cancelled',
    color: '#64748B',
    bgColor: '#F1F5F9',
    description: 'Đơn hàng đã được hủy thành công (tồn kho đã được hoàn lại).',
    allowedTransitions: {
      buyer: [],
      seller: [],
      admin: [],
    },
  },
};

// Returns whether actor is permitted to transition from status -> targetStatus
export const canTransitionOrder = (currentStatus, targetStatus, actorRole) => {
  const statusConfig = ORDER_STATUS_DETAILS[currentStatus];
  if (!statusConfig) return false;
  const allowed = statusConfig.allowedTransitions[actorRole] || [];
  return allowed.includes(targetStatus);
};
