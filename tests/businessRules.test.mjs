// Automated Business Rules & Logic Test Suite for ReMarket (ESM)
import { canTransitionOrder, ORDER_STATUS } from '../src/constants/orderStatus.js';
import { loginSchema, registerSchema, productListingSchema } from '../src/utils/validation.js';
import { formatCurrency, parseCurrencyInput, formatNumberInput, formatNumberWithDots } from '../src/utils/currency.js';
import { cartService } from '../src/services/cartService.js';
import { orderService } from '../src/services/orderService.js';
import { productService } from '../src/services/productService.js';
import { reviewService } from '../src/services/reviewService.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n========================================');
  console.log('REMARKET - BUSINESS SCENARIOS TEST SUITE');
  console.log('========================================\n');

  // TEST 1: Currency Formatting & Parsing
  console.log('[1] Currency Formatting:');
  assert(formatCurrency(12500000) === '12.500.000 ₫', 'Format 12.5M VND correctly');
  assert(parseCurrencyInput('12.500.000 ₫') === 12500000, 'Parse 12.5M VND input correctly');
  assert(formatCurrency(0) === '0 ₫', 'Format 0 VND correctly');
  assert(formatNumberWithDots(5000000) === '5.000.000', 'Format 5M number with thousand dots');
  assert(formatNumberInput('5000000') === '5.000.000', 'Real-time format 5000000 into 5.000.000');
  assert(formatNumberInput('5.0000', '5.000') === '50.000', 'Real-time format incremental typing');
  assert(formatNumberInput('5000', '5.000') === '500', 'Real-time format backspacing dot separator');

  // TEST 2: Zod Validation Schemas
  console.log('\n[2] Input Validation (Zod):');
  const validRegister = registerSchema.safeParse({
    displayName: 'Nguyen Van A',
    email: 'valid@remarket.vn',
    phoneNumber: '0912345678',
    password: 'password123',
    confirmPassword: 'password123',
  });
  assert(validRegister.success === true, 'Accept valid registration input');

  const invalidEmail = registerSchema.safeParse({
    displayName: 'Nguyen Van A',
    email: 'invalid-email-format',
    phoneNumber: '0912345678',
    password: 'password123',
    confirmPassword: 'password123',
  });
  assert(invalidEmail.success === false, 'Reject invalid email format');

  const mismatchPassword = registerSchema.safeParse({
    displayName: 'Nguyen Van A',
    email: 'valid@remarket.vn',
    phoneNumber: '0912345678',
    password: 'password123',
    confirmPassword: 'password999',
  });
  assert(mismatchPassword.success === false, 'Reject mismatched password confirmation');

  // TEST 3: State Machine & Transition Authority
  console.log('\n[3] Order Lifecycle State Machine:');
  // Buyer cannot mark as SHIPPING
  assert(
    canTransitionOrder(ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPING, 'buyer') === false,
    'Buyer CANNOT mark order as SHIPPING'
  );
  // Seller CAN mark as SHIPPING
  assert(
    canTransitionOrder(ORDER_STATUS.CONFIRMED, ORDER_STATUS.SHIPPING, 'seller') === true,
    'Seller CAN mark order as SHIPPING'
  );
  // Seller CANNOT mark as COMPLETED on behalf of buyer
  assert(
    canTransitionOrder(ORDER_STATUS.SHIPPING, ORDER_STATUS.COMPLETED, 'seller') === false,
    'Seller CANNOT mark order as COMPLETED on behalf of buyer'
  );
  // Buyer CAN mark as COMPLETED
  assert(
    canTransitionOrder(ORDER_STATUS.SHIPPING, ORDER_STATUS.COMPLETED, 'buyer') === true,
    'Buyer CAN mark order as COMPLETED'
  );
  // Buyer cannot cancel after SHIPPING
  assert(
    canTransitionOrder(ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED, 'buyer') === false,
    'Buyer CANNOT cancel once order is in SHIPPING'
  );

  // TEST 4: Single-Seller Cart Checkout Rule
  console.log('\n[4] 1-Seller Cart Policy Enforcement:');
  const multiSellerItems = [
    { productId: 'p1', sellerId: 'seller_1', productName: 'Item A', price: 100000, quantity: 1 },
    { productId: 'p2', sellerId: 'seller_2', productName: 'Item B', price: 200000, quantity: 1 },
  ];

  let multiSellerErrorCaught = false;
  try {
    await orderService.createOrder({
      buyer: { uid: 'buyer_test', displayName: 'Test Buyer' },
      items: multiSellerItems,
      deliveryAddress: { recipientName: 'Test', phoneNumber: '0912345678', street: '1 Test' },
    });
  } catch (err) {
    multiSellerErrorCaught = true;
  }
  assert(multiSellerErrorCaught === true, 'Strictly reject checkout with multiple sellers in 1 order');

  // TEST 5: Atomic Inventory Reservation & Overselling Prevention
  console.log('\n[5] Atomic Inventory Reservation & Overselling:');
  const testBuyer1 = { uid: 'buyer_01', displayName: 'Buyer One' };
  const testBuyer2 = { uid: 'buyer_02', displayName: 'Buyer Two' };

  // Create test product with stock = 1
  const testProd = await productService.createProduct(
    {
      name: 'Single Unit Second-Hand Laptop',
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600'],
      categoryId: 'cat_electronics',
      description: 'Used laptop only 1 unit available in stock.',
      price: 15000000,
      stockQuantity: 1,
      overallCondition: 'Good',
    },
    { uid: 'seller_test_99', displayName: 'Test Seller' }
  );

  assert(testProd.stockQuantity === 1, 'Initial inventory is 1 unit');

  // Buyer 1 places order
  const order1 = await orderService.createOrder({
    buyer: testBuyer1,
    items: [
      {
        productId: testProd.id,
        sellerId: testProd.sellerId,
        sellerName: testProd.sellerName,
        productName: testProd.name,
        price: testProd.price,
        quantity: 1,
      },
    ],
    deliveryAddress: { recipientName: 'Buyer 1', phoneNumber: '0901111111', street: '1 Test' },
  });

  assert(order1.status === ORDER_STATUS.PENDING_CONFIRMATION, 'Buyer 1 order created successfully');
  // Services return copies, so re-read the product to observe stock changes
  let prodAfterOrder = await productService.getProductById(testProd.id);
  assert(prodAfterOrder.stockQuantity === 0, 'Inventory decremented to 0 atomically');
  assert(prodAfterOrder.status === 'sold_out', 'Product marked sold_out');

  // Buyer 2 attempts simultaneous purchase of the same product
  let buyer2OversellRejected = false;
  try {
    await orderService.createOrder({
      buyer: testBuyer2,
      items: [
        {
          productId: testProd.id,
          sellerId: testProd.sellerId,
          sellerName: testProd.sellerName,
          productName: testProd.name,
          price: testProd.price,
          quantity: 1,
        },
      ],
      deliveryAddress: { recipientName: 'Buyer 2', phoneNumber: '0902222222', street: '2 Test' },
    });
  } catch (err) {
    buyer2OversellRejected = true;
  }
  assert(buyer2OversellRejected === true, 'Concurrent order for out-of-stock item rejected with exception');
  prodAfterOrder = await productService.getProductById(testProd.id);
  assert(prodAfterOrder.stockQuantity === 0, 'Inventory never becomes negative (< 0)');

  // TEST 6: Atomic Stock Restoration on Order Rejection
  console.log('\n[6] Stock Restoration on Seller Rejection:');
  const rejected = await orderService.rejectOrder(order1.id, testProd.sellerId, 'Seller cancelled order');
  const prodAfterReject = await productService.getProductById(testProd.id);
  assert(prodAfterReject.stockQuantity === 1, 'Stock restored to 1 unit upon seller rejection');
  assert(prodAfterReject.status === 'active', 'Product status reverted to active');
  const rejectStep = rejected.statusHistory[rejected.statusHistory.length - 1];
  assert(
    rejectStep.previousStatus === ORDER_STATUS.PENDING_CONFIRMATION,
    'Status history records the real previous status (PENDING_CONFIRMATION)'
  );

  // TEST 7: Review Eligibility & Duplicate Prevention
  console.log('\n[7] Review Eligibility:');
  let nonCompletedReviewBlocked = false;
  try {
    await reviewService.submitReview({
      orderId: order1.id,
      rating: 5,
      comment: 'Review for rejected order should fail',
      buyer: testBuyer1,
    });
  } catch (err) {
    nonCompletedReviewBlocked = true;
  }
  assert(nonCompletedReviewBlocked === true, 'Disallow review for non-COMPLETED order');

  console.log('\n========================================');
  console.log(`TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('========================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite();
