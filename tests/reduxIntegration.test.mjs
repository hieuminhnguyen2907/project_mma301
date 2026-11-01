// Regression test: service results stored in Redux get deep-frozen by Immer.
// Services must keep working after their return values have gone through the store
// (previously checkout/confirm/ship/address updates threw "Cannot assign to read only property").
import { configureStore, createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { MOCK_PRODUCTS } from '../src/services/mockData.js';
import { productService } from '../src/services/productService.js';
import { orderService } from '../src/services/orderService.js';
import { authService } from '../src/services/authService.js';
import { reviewService } from '../src/services/reviewService.js';
import { notificationService } from '../src/services/notificationService.js';
import { storage } from '../src/utils/storage.js';

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

async function expectOk(promise, message) {
  try {
    const value = await promise;
    assert(true, message);
    return value;
  } catch (err) {
    assert(false, `${message} (threw: ${err.message})`);
    return null;
  }
}

// Mirrors the app slices: MOCK_PRODUCTS as initial state, payloads stored as-is
const run = createAsyncThunk('test/run', async (fn) => fn());
const slice = createSlice({
  name: 'mirror',
  initialState: { products: MOCK_PRODUCTS, last: null, history: [] },
  reducers: {},
  extraReducers: (b) =>
    b.addCase(run.fulfilled, (state, action) => {
      state.last = action.payload;
      state.history.push(action.payload);
    }),
});
const store = configureStore({ reducer: { mirror: slice.reducer } });
const viaStore = (fn) => store.dispatch(run(fn)).unwrap();

async function runSuite() {
  console.log('========================================');
  console.log('REMARKET - REDUX INTEGRATION (FROZEN STATE)');
  console.log('========================================\n');

  // Products/users/orders all pass through the store first, like in the app
  await viaStore(() => productService.getProducts());
  const buyer = await viaStore(() => authService.demoLogin('buyer'));
  await viaStore(() => authService.demoLogin('seller'));
  await storage.saveUser(buyer);

  console.log('[1] Checkout & order lifecycle after state is frozen:');
  const product = (await productService.getProducts()).find(
    (p) => p.sellerId === 'user_seller_nam' && p.stockQuantity > 0
  );
  const order = await expectOk(
    viaStore(() =>
      orderService.createOrder({
        buyer,
        items: [{ productId: product.id, sellerId: product.sellerId, productName: product.name, quantity: 1 }],
        deliveryAddress: buyer.addresses[0],
      })
    ),
    'Place order on a product that is part of frozen Redux state'
  );
  await viaStore(() => orderService.getSellerOrders('user_seller_nam'));
  await expectOk(
    viaStore(() => orderService.confirmOrder(order.id, 'user_seller_nam')),
    'Seller confirms a frozen order'
  );
  await expectOk(
    viaStore(() => orderService.shipOrder(order.id, 'user_seller_nam', 'VNPOST-1')),
    'Seller ships the order'
  );
  await expectOk(
    viaStore(() => orderService.completeOrder(order.id, buyer.uid)),
    'Buyer completes the order'
  );
  await expectOk(
    viaStore(() => reviewService.submitReview({ orderId: order.id, rating: 5, comment: 'Đúng mô tả, cảm ơn shop', buyer })),
    'Buyer reviews the completed order'
  );
  const reviewed = await orderService.getOrderById(order.id);
  assert(reviewed.isReviewed === true, 'Order flagged as reviewed');

  console.log('\n[2] Session safety:');
  const session = await storage.getUser();
  assert(session.uid === buyer.uid, 'Reviewing a seller does not replace the buyer session with the seller');

  console.log('\n[3] Address book on a frozen user:');
  const withAddress = await expectOk(
    viaStore(() =>
      authService.addAddress(buyer.uid, {
        recipientName: 'Linh',
        phoneNumber: '0912345678',
        street: '1 Lê Lợi',
        ward: 'Bến Nghé',
        district: 'Quận 1',
        city: 'Hồ Chí Minh',
      })
    ),
    'Add address to the signed-in (frozen) user'
  );
  await expectOk(
    viaStore(() => authService.setDefaultAddress(buyer.uid, withAddress.addresses[1].id)),
    'Change default address'
  );

  console.log('\n[4] Favorites & notifications:');
  await expectOk(
    viaStore(() => productService.toggleFavorite(buyer.uid, product.id)),
    'Toggle favorite on a product held in frozen state'
  );
  const notifs = await viaStore(() => notificationService.getNotifications('user_seller_nam'));
  await expectOk(notificationService.markAsRead(notifs[0].id), 'Mark a frozen notification as read');

  console.log('\n[5] Admin moderation:');
  await expectOk(
    viaStore(() => productService.moderateProduct(product.id, 'hide', 'test')),
    'Hide a listing'
  );
  const adminList = await productService.getProducts({ includeAllStatuses: true });
  assert(adminList.some((p) => p.id === product.id && p.status === 'hidden'), 'Hidden listing still visible to admin');
  await expectOk(
    viaStore(() => authService.toggleUserStatus('user_seller_nam', 'active')),
    'Suspend a user who was previously stored in Redux'
  );

  console.log('\n========================================');
  console.log(`REDUX INTEGRATION TOTAL: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
  console.log('========================================\n');
  if (failedTests > 0) process.exit(1);
}

runSuite();
