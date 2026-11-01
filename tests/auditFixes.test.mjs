// Regression tests for the pre-release audit fixes (offline demo mode, no network)
import { productService } from '../src/services/productService.js';
import { orderService } from '../src/services/orderService.js';
import { walletService } from '../src/services/walletService.js';
import { reviewService } from '../src/services/reviewService.js';
import { disputeService } from '../src/services/disputeService.js';
import { chatService } from '../src/services/chatService.js';
import { normalizeVisionResult } from '../src/services/aiVisionPrompt.js';
import { getCategoryConditionSchema, DEFAULT_CATEGORIES } from '../src/constants/categories.js';
import { validateFullProductListing } from '../src/utils/validation.js';
import { calculateConditionScore } from '../src/utils/conditionScore.js';

let total = 0;
let failed = 0;
const assert = (cond, msg) => {
  total++;
  if (cond) console.log(`  ✓ PASS: ${msg}`);
  else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
};
const rejects = async (promise) => {
  try {
    await promise;
    return false;
  } catch (_err) {
    return true;
  }
};

const seller = { uid: 'audit_seller', displayName: 'Audit Seller', ratingCount: 0 };
const buyer = { uid: 'audit_buyer', displayName: 'Audit Buyer' };
const address = { recipientName: 'Buyer', phoneNumber: '0912345678', street: '1 Lê Lợi', district: 'Quận 1', city: 'Hồ Chí Minh' };
const IMAGE = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600';

const makeProduct = (stock = 1) =>
  productService.createProduct(
    { name: 'Audit item', categoryId: 'cat_books', description: 'Sản phẩm dùng cho kiểm thử', price: 200000, stockQuantity: stock, images: [IMAGE] },
    seller
  );
const placeAndComplete = async (product) => {
  const order = await orderService.createOrder({
    buyer,
    items: [{ productId: product.id, sellerId: product.sellerId, productName: product.name, price: product.price, quantity: 1 }],
    deliveryAddress: address,
  });
  await orderService.confirmOrder(order.id, seller.uid);
  await orderService.shipOrder(order.id, seller.uid, 'VNPOST-123456');
  return orderService.completeOrder(order.id, buyer.uid);
};

async function run() {
  console.log('========================================');
  console.log('REMARKET - PRE-RELEASE AUDIT REGRESSIONS');
  console.log('========================================\n');

  console.log('[1] Listings:');
  assert(
    await rejects(productService.createProduct({ name: 'No photo item', categoryId: 'cat_books', description: 'x'.repeat(30), price: 50000 }, seller)),
    'A listing without a real photo is rejected (no stock placeholder image)'
  );
  const p1 = await makeProduct(1);
  assert(p1.sellerRating === null, 'A seller without reviews gets no fake 5.0 rating');
  assert(
    await rejects(productService.updateProduct(p1.id, { status: 'active' }, seller.uid)),
    'Sellers cannot change moderation status through updateProduct'
  );
  await productService.moderateProduct(p1.id, 'hide', 'Kiểm tra');
  assert(
    await rejects(productService.setListingVisibility(p1.id, true, seller.uid)),
    'Seller cannot re-show a listing hidden by an admin'
  );
  await productService.moderateProduct(p1.id, 'approve');
  await productService.setListingVisibility(p1.id, false, seller.uid);
  const reShown = await productService.setListingVisibility(p1.id, true, seller.uid);
  assert(reShown.status === 'active' && reShown.hiddenBy === null, 'Seller can hide and re-show their own listing');

  console.log('\n[2] Wallet (credited once, on the seller side):');
  const p2 = await makeProduct(1);
  const completed = await placeAndComplete(p2);
  const w1 = await walletService.getWallet(seller.uid);
  const balanceAfterFirst = w1.availableBalance;
  assert(balanceAfterFirst >= completed.subtotal, 'Completed COD order is credited when the seller opens the wallet');
  const w2 = await walletService.getWallet(seller.uid);
  await walletService.creditPendingCOD(seller.uid, completed.subtotal, completed.id);
  assert(w2.availableBalance === balanceAfterFirst, 'The same order is never credited twice');
  assert(
    await rejects(walletService.requestWithdrawal({ userId: seller.uid, amount: 50000, bankName: 'ACB', accountNumber: 'abc', accountHolder: 'A' })),
    'Withdrawal with a non-numeric account number is rejected'
  );
  assert(
    await rejects(walletService.requestWithdrawal({ userId: seller.uid, amount: 'abc', bankName: 'ACB', accountNumber: '123456789', accountHolder: 'A B' })),
    'Withdrawal with a non-numeric amount cannot turn the balance into NaN'
  );

  console.log('\n[3] Reviews:');
  await reviewService.submitReview({ orderId: completed.id, rating: 4, comment: 'Đúng mô tả, đóng gói tốt', buyer });
  assert(
    await rejects(reviewService.submitReview({ orderId: completed.id, rating: 5, comment: 'Gửi đánh giá lần thứ hai', buyer })),
    'Second review for the same order is rejected'
  );
  assert(
    await rejects(reviewService.submitReview({ orderId: completed.id, rating: 9, comment: 'Số sao không hợp lệ', buyer })),
    'Rating outside 1-5 is rejected'
  );

  console.log('\n[4] Returns & reports:');
  const p3 = await makeProduct(1);
  const pending = await orderService.createOrder({
    buyer,
    items: [{ productId: p3.id, sellerId: p3.sellerId, productName: p3.name, price: p3.price, quantity: 1 }],
    deliveryAddress: address,
  });
  assert(
    await rejects(disputeService.submitReturnRequest({ order: pending, buyer, reason: 'wrong_item', explanation: 'Giao sai sản phẩm so với mô tả' })),
    'Return request for a not-yet-received order is rejected'
  );
  assert(
    await rejects(disputeService.submitReturnRequest({ order: completed, buyer: seller, reason: 'wrong_item', explanation: 'Người khác gửi khiếu nại thay' })),
    'Only the buyer of the order can file a return'
  );
  const ret = await disputeService.submitReturnRequest({ order: completed, buyer, reason: 'wrong_item', explanation: 'Giao sai sản phẩm so với mô tả' });
  assert((await orderService.getOrderById(completed.id)).hasDispute === true, 'Order is flagged as disputed');
  assert(
    await rejects(disputeService.submitReturnRequest({ order: completed, buyer, reason: 'wrong_item', explanation: 'Khiếu nại lần hai cho cùng đơn' })),
    'Only one return request per order'
  );
  const resolved = await disputeService.resolveReturnRequest(ret.id, 'approved', 'Hoàn tiền', 'admin_uid');
  assert(resolved.status === 'approved', 'Admin can resolve a return request');
  assert(
    await rejects(disputeService.submitReport({ reporter: seller, targetType: 'product', targetId: p3.id, targetOwnerId: seller.uid, reason: 'other', description: 'Tự báo cáo tin đăng của mình' })),
    'A seller cannot report their own listing'
  );
  const report = await disputeService.submitReport({ reporter: buyer, targetType: 'product', targetId: p3.id, targetOwnerId: seller.uid, reason: 'other', description: 'Mô tả không khớp với ảnh thực tế' });
  const dismissed = await disputeService.resolveReport(report.id, 'dismissed', 'Không có căn cứ', 'admin_uid');
  assert(dismissed.status === 'dismissed', 'A dismissed report is stored as dismissed, not resolved');

  console.log('\n[5] Chat:');
  assert(
    await rejects(chatService.getOrCreateConversation({ product: p3, buyer: null })),
    'Guests cannot open a chat'
  );
  assert(
    await rejects(chatService.getOrCreateConversation({ product: p3, buyer: seller })),
    'A seller cannot chat with themselves about their own listing'
  );
  const conv = await chatService.getOrCreateConversation({ product: p3, buyer });
  assert(conv.sellerId === seller.uid, 'Conversation is bound to the real seller (no default demo seller)');
  const guestView = await chatService.getConversations('guest_device');
  assert(!guestView.some((c) => c.id === conv.id), 'Conversations are not visible to anyone but the two participants');

  console.log('\n[6] AI condition pre-fill:');
  const vision = normalizeVisionResult({
    isSellableProduct: true,
    name: 'Tai nghe Sony WH-1000XM4',
    categoryId: 'cat_electronics',
    subCategoryId: 'audio_headphones',
    overallCondition: 'Very Good',
    conditionFields: [
      { fieldKey: 'screenCondition', value: 'Trầy xước lông mèo nhẹ' },
      { fieldKey: 'exteriorAndEarPads', value: getCategoryConditionSchema('cat_electronics', 'audio_headphones').find((f) => f.fieldKey === 'exteriorAndEarPads').options[0] },
    ],
  });
  assert(vision.subCategoryId === 'audio_headphones', 'Sub-category from the model is kept when it belongs to the category');
  assert(!('screenCondition' in vision.conditionData), 'Fields that do not exist in the sub-category form are dropped');
  assert('exteriorAndEarPads' in vision.conditionData, 'Visible fields of the sub-category form are pre-filled');

  console.log('\n[7] Product-type condition forms (charger photo scenario):');
  const charger = normalizeVisionResult({
    isSellableProduct: true,
    name: 'Củ sạc nhanh Apple 20W USB-C',
    categoryId: 'cat_electronics',
    subCategoryId: 'chargers_power',
    overallCondition: 'Very Good',
    conditionFields: [
      { fieldKey: 'functionAndButtons', value: 'Mọi phím, nút bấm nhạy, không lỗi' },
      { fieldKey: 'exteriorCondition', value: 'Trầy xước nhẹ, chỉ thấy khi nhìn gần' },
    ],
  });
  assert(charger.subCategoryId === 'chargers_power', 'A charger photo lands in "Sạc, Cáp & Pin dự phòng"');
  assert(!('functionAndButtons' in charger.conditionData), 'No key/button answer is pre-filled for a charger');
  assert(charger.conditionData.exteriorCondition === 'Trầy xước nhẹ, chỉ thấy khi nhìn gần', 'Visible wear of the charger is pre-filled');

  const inferred = normalizeVisionResult({ name: 'Cáp sạc Anker Lightning', categoryId: 'cat_electronics', subCategoryId: 'apparel' });
  assert(inferred.subCategoryId === 'chargers_power', 'A sub-category from another category is replaced by one inferred from the name');

  const electronics = DEFAULT_CATEGORIES.find((c) => c.id === 'cat_electronics');
  const baseForm = {
    name: 'Củ sạc Apple 20W',
    categoryId: 'cat_electronics',
    price: '200000',
    stockQuantity: '1',
    description: 'Củ sạc dùng 3 tháng, còn hoạt động tốt',
    overallCondition: 'Very Good',
    city: 'Hồ Chí Minh',
    district: 'Quận 1',
    streetAddress: '1 Lê Lợi',
  };
  const noType = validateFullProductListing({ form: { ...baseForm, subCategoryId: null }, images: [IMAGE], selectedCategory: electronics, activeSchema: [], conditionData: {} });
  assert(Boolean(noType.errors.subCategoryId), 'The seller must choose the product type (no silent default)');

  const cameraSchema = getCategoryConditionSchema('cat_electronics', 'cameras');
  const cameraData = {
    workingCondition: cameraSchema[0].options[0],
    lensSensorCondition: cameraSchema[1].options[0],
    bodyCondition: cameraSchema[2].options[0],
  };
  const badShutter = validateFullProductListing({
    form: { ...baseForm, subCategoryId: 'cameras' },
    images: [IMAGE],
    selectedCategory: electronics,
    activeSchema: cameraSchema,
    conditionData: { ...cameraData, shutterCount: 1.5 },
  });
  assert(Boolean(badShutter.errors.shutterCount), 'Number fields are validated against their own rules (not only battery %)');
  const okCamera = validateFullProductListing({
    form: { ...baseForm, subCategoryId: 'cameras' },
    images: [IMAGE],
    selectedCategory: electronics,
    activeSchema: cameraSchema,
    conditionData: { ...cameraData, shutterCount: 12000 },
  });
  assert(okCamera.isValid, 'A 5-digit shutter count is accepted (the old form capped numbers at 3 digits)');

  const chargerSchema = getCategoryConditionSchema('cat_electronics', 'chargers_power');
  const scoreOf = (pick) =>
    calculateConditionScore({
      categoryId: 'cat_electronics',
      subCategoryId: 'chargers_power',
      condition: {
        overallRating: 'Good',
        chargingPerformance: pick(chargerSchema[0].options),
        exteriorCondition: pick(chargerSchema[1].options),
      },
      knownDefects: [],
    }).score;
  assert(scoreOf((o) => o[0]) > scoreOf((o) => o[o.length - 1]), 'Condition score follows the declared answers of the product type');

  console.log('\n========================================');
  console.log(`AUDIT FIXES TOTAL: ${total} | PASSED: ${total - failed} | FAILED: ${failed}`);
  console.log('========================================\n');
  if (failed > 0) process.exit(1);
  process.exit(0);
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
