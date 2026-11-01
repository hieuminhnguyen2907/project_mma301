// Comprehensive Test Suite for ReMarket Advanced C2C Features
// 1. Condition Score & Valuation Estimator
// 2. Order Lifecycle & Dual-Mode Persistence
// 3. Real-time C2C Chat Threading
// 4. Seller Wallet & COD Settlement
// 5. Favorites Persistence
// 6. AI Vision Product Listing Analysis

import { calculateConditionScore } from '../src/utils/conditionScore.js';
import { orderService } from '../src/services/orderService.js';
import { walletService } from '../src/services/walletService.js';
import { chatService } from '../src/services/chatService.js';
import { productService } from '../src/services/productService.js';
import { aiService } from '../src/services/aiService.js';
import { parseGeocodeAddress, resolveCoordinates } from '../src/utils/locationHelper.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runAdvancedSuite() {
  console.log('\n======================================================');
  console.log('REMARKET - ADVANCED MARKETPLACE MODULES TEST SUITE');
  console.log('======================================================\n');

  // -----------------------------------------------------------------
  // [1] REMARKET CONDITION SCORE & VALUATION ENGINE
  // -----------------------------------------------------------------
  console.log('[1] ReMarket Condition Score & Valuation Engine:');

  const pristineProduct = {
    price: 15000000,
    condition: { overallRating: 'like_new' },
    conditionDetails: { batteryHealth: 98, screenCondition: 'no_scratches' },
    knownDefects: [],
  };
  const pristineResult = calculateConditionScore(pristineProduct);
  assert(pristineResult.score >= 90, `Like new product scores >= 90 (Actual: ${pristineResult.score})`);
  assert(pristineResult.badge === 'SUPER_CLEAN', `Like new tagged as SUPER_CLEAN (Actual: ${pristineResult.badge})`);

  const defectiveProduct = {
    price: 5000000,
    condition: { overallRating: 'fair' },
    conditionDetails: { batteryHealth: 74, screenCondition: 'cracked' },
    knownDefects: ['Màn hình nứt góc nhẹ', 'Pin chai dưới 80%', 'Móp viền góc dưới'],
  };
  const defectiveResult = calculateConditionScore(defectiveProduct);
  assert(defectiveResult.score < 60, `Defective product score heavily penalized (<60) (Actual: ${defectiveResult.score})`);
  assert(!('marketRange' in defectiveResult), 'No fabricated market valuation derived from the listing price');

  // -----------------------------------------------------------------
  // [2] ORDER LIFECYCLE & DUAL-MODE PERSISTENCE
  // -----------------------------------------------------------------
  console.log('\n[2] Order Lifecycle & Dual-Mode Persistence:');

  const buyerUser = { uid: 'buyer_test_001', displayName: 'Nguyen Van A' };
  const mockListing = {
    id: 'prod_order_test',
    name: 'Tai nghe Sony WH-1000XM4 cũ',
    price: 3200000,
    sellerId: 'seller_test_001',
    sellerName: 'Tran Van B',
    primaryImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  };

  const buyerOrders = await orderService.getBuyerOrders(buyerUser.uid);
  assert(Array.isArray(buyerOrders), 'Buyer orders retrieved as an array');

  const sellerOrders = await orderService.getSellerOrders(mockListing.sellerId);
  assert(Array.isArray(sellerOrders), 'Seller orders retrieved as an array');

  // Verify retrieval of an existing mock order
  const existingOrder = await orderService.getOrderById('order_demo_101');
  assert(existingOrder && existingOrder.id === 'order_demo_101', 'Order retrieved successfully by ID');
  assert(existingOrder.totalAmount > 0, `Order has valid total amount (${existingOrder.totalAmount} VND)`);
  assert(existingOrder.items && existingOrder.items.length > 0, 'Order contains product items');

  // -----------------------------------------------------------------
  // [3] REAL-TIME C2C IN-APP CHAT
  // -----------------------------------------------------------------
  console.log('\n[3] In-App Chat & Inquiries:');

  const threadId = chatService.getThreadId(buyerUser.uid, mockListing.sellerId, mockListing.id);
  assert(threadId.includes(mockListing.id), 'Thread ID deterministically binds buyer, seller and product');

  const msg1 = await chatService.sendMessage({
    threadId,
    senderId: buyerUser.uid,
    senderName: buyerUser.displayName,
    text: 'Sản phẩm này còn phụ kiện hộp zin không bạn ơi?',
    productId: mockListing.id,
  });

  assert(msg1.id !== undefined, 'Message delivered with timestamp');

  const messages = await chatService.getMessages(threadId);
  assert(messages.length >= 1, `Thread contains messages (Count: ${messages.length})`);
  assert(messages[messages.length - 1].text.includes('phụ kiện'), 'Message content verified');

  // -----------------------------------------------------------------
  // [4] SELLER WALLET & COD FINANCIAL SETTLEMENT
  // -----------------------------------------------------------------
  console.log('\n[4] Seller Wallet & COD Financial Settlement:');

  const sellerWallet = await walletService.getWallet(mockListing.sellerId);
  assert(sellerWallet.availableBalance !== undefined, 'Seller wallet loaded with balance');

  // Simulate COD payout on order completion
  const updatedWallet = await walletService.creditPendingCOD(mockListing.sellerId, 2800000, 'order_test_999');
  assert(updatedWallet.availableBalance >= 2800000, 'COD earnings credited to seller available balance');

  // Test withdrawal validation (cannot withdraw more than available)
  let withdrawError = null;
  try {
    await walletService.requestWithdrawal({
      sellerId: mockListing.sellerId,
      amount: updatedWallet.availableBalance + 5000000, // Excessive amount
      bankName: 'Vietcombank',
      accountNumber: '0123456789',
      accountHolder: 'TRAN VAN B',
    });
  } catch (err) {
    withdrawError = err;
  }
  assert(withdrawError !== null, 'Rejects withdrawal exceeding available balance');

  // Test valid withdrawal
  const validWithdrawal = await walletService.requestWithdrawal({
    sellerId: mockListing.sellerId,
    amount: 1000000,
    bankName: 'Techcombank',
    accountNumber: '1903456789',
    accountHolder: 'TRAN VAN B',
  });
  assert(validWithdrawal.status === 'PENDING', 'Valid withdrawal recorded as a pending payout request');

  // -----------------------------------------------------------------
  // [5] FAVORITES PERSISTENCE & UNDERSCORE USER ID PARSING
  // -----------------------------------------------------------------
  console.log('\n[5] Favorites Persistence & Retrieval:');

  const complexUserId = 'user_buyer_linh_special_test';
  const targetProdId = 'prod_01';

  // Toggle on
  const isNowFav = await productService.toggleFavorite(complexUserId, targetProdId);
  assert(isNowFav === true, 'Successfully added product to favorites');

  // Retrieve
  const favList = await productService.getFavoriteProducts(complexUserId);
  assert(favList.length >= 1, 'Favorite products list retrieved');
  assert(favList.some((p) => p.id === targetProdId), 'Product ID correctly parsed despite underscores in userId');

  // Toggle off
  const isUntoggled = await productService.toggleFavorite(complexUserId, targetProdId);
  assert(isUntoggled === false, 'Successfully removed product from favorites on re-toggle');

  const favListAfter = await productService.getFavoriteProducts(complexUserId);
  assert(!favListAfter.some((p) => p.id === targetProdId), 'Product no longer in favorites list');

  // -----------------------------------------------------------------
  // [6] AI VISION PRODUCT LISTING ANALYSIS & AUTO-FILL
  // -----------------------------------------------------------------
  console.log('\n[6] AI Vision Product Listing Analysis & Auto-Fill:');

  const visionAnalysis = await aiService.analyzeProductImage({
    imageUri: 'file:///path/to/test_sample_image.jpg',
  });

  assert(visionAnalysis !== null && typeof visionAnalysis === 'object', 'AI Vision returns structured analysis');
  assert(typeof visionAnalysis.name === 'string' && visionAnalysis.name.length > 5, 'AI correctly extracts product title');
  assert(['cat_electronics', 'cat_clothing', 'cat_books', 'cat_appliances', 'cat_vehicles', 'cat_sports_hobbies', 'cat_other'].includes(visionAnalysis.categoryId), 'AI identifies valid category');
  assert(['Like New', 'Very Good', 'Good', 'Acceptable'].includes(visionAnalysis.overallCondition), 'AI determines realistic condition rating');
  assert(visionAnalysis.suggestedPrice > 0, 'AI suggests valuation in VND');
  assert(typeof visionAnalysis.description === 'string' && visionAnalysis.description.length > 20, 'AI generates comprehensive description');
  assert(Array.isArray(visionAnalysis.knownDefects), 'AI extracts visual defects array');

  // -----------------------------------------------------------------
  // [7] GPS LOCATION DETECTION & GEOCODING PARSER
  // -----------------------------------------------------------------
  console.log('\n[7] GPS Location Detection & Reverse Geocoding Parser:');

  const hcmcSample = {
    region: 'Thành phố Hồ Chí Minh',
    subregion: 'Quận 1',
    district: 'Phường Bến Nghé',
    street: 'Đường Lê Lợi',
    streetNumber: '123',
  };
  const parsedHcmc = parseGeocodeAddress(hcmcSample);
  assert(parsedHcmc.city === 'Hồ Chí Minh', 'HCMC geocode resolves city to Hồ Chí Minh');
  assert(parsedHcmc.district === 'Quận 1', 'HCMC geocode resolves district to Quận 1');
  assert(parsedHcmc.ward === 'Phường Bến Nghé', 'HCMC geocode resolves ward to Phường Bến Nghé');
  assert(parsedHcmc.streetAddress === '123 Đường Lê Lợi', 'HCMC geocode resolves street address to 123 Đường Lê Lợi');

  const hanoiSample = {
    region: 'Hà Nội',
    city: 'Cầu Giấy',
    district: 'Phường Dịch Vọng Hậu',
    name: 'Số 8 Tôn Thất Thuyết',
  };
  const parsedHanoi = parseGeocodeAddress(hanoiSample);
  assert(parsedHanoi.city === 'Hà Nội', 'Hanoi geocode resolves city to Hà Nội');
  assert(parsedHanoi.district === 'Cầu Giấy', 'Hanoi geocode resolves district to Cầu Giấy');

  const customCoords = { lat: 10.7629, lng: 106.6823 };
  const resolvedCustom = resolveCoordinates('Hà Nội', 'Cầu Giấy', customCoords);
  assert(resolvedCustom.lat === 10.7629 && resolvedCustom.lng === 106.6823, 'resolveCoordinates prioritizes exact GPS coordinates when available');

  const resolvedFallback = resolveCoordinates('Hà Nội', 'Hoàn Kiếm', null);
  assert(resolvedFallback.lat === 21.0285 && resolvedFallback.lng === 105.8542, 'resolveCoordinates falls back to city/district lookup when GPS is null');

  const emptyParse = parseGeocodeAddress(null);
  assert(emptyParse === null, 'parseGeocodeAddress safely handles null geocode object');

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`ADVANCED FEATURES TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAdvancedSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
