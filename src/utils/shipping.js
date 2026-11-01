// Delivery fee rules shared by the checkout screen (display) and orderService (charge),
// so the amount the buyer confirms is the amount the order records.
export const DEFAULT_SHIPPING_FEE = 30000;

// One order = one seller = one parcel: charge the highest estimate among its products
export const calculateDeliveryFee = (products = []) => {
  const fees = products
    .map((p) => Number(p?.deliveryInfo?.shippingFeeEstimate))
    .filter((fee) => Number.isFinite(fee) && fee >= 0);
  return fees.length > 0 ? Math.max(...fees) : DEFAULT_SHIPPING_FEE;
};
