// Checkout regression tests: price the buyer saw, server-side delivery fee, double
// submit, unique order numbers, reservation release on shipping, phone validation.
import { productService } from '../src/services/productService.js';
import { orderService } from '../src/services/orderService.js';
import { cartService } from '../src/services/cartService.js';
import { calculateDeliveryFee, DEFAULT_SHIPPING_FEE } from '../src/utils/shipping.js';
import { isValidVietnamesePhone } from '../src/utils/validation.js';

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

const buyer = { uid: 'checkout_buyer', displayName: 'Checkout Buyer' };
const seller = { uid: 'checkout_seller', displayName: 'Checkout Seller' };
const address = { recipientName: 'Buyer', phoneNumber: '0912345678', street: '1 Lê Lợi', city: 'Hồ Chí Minh' };

const makeProduct = (stock, price = 100000) =>
  productService.createProduct(
    { name: 'Checkout test item', categoryId: 'cat_books', description: 'Sản phẩm dùng cho kiểm thử thanh toán', price, stockQuantity: stock, images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600'] },
    seller
  );
const line = (p, extra = {}) => ({
  productId: p.id,
  sellerId: p.sellerId,
  sellerName: p.sellerName,
  productName: p.name,
  price: p.price,
  quantity: 1,
  ...extra,
});
const rejects = async (promise) => {
  try {
    await promise;
    return null;
  } catch (err) {
    return err;
  }
};

console.log('========================================');
console.log('REMARKET - CHECKOUT FLOW');
console.log('========================================\n');

console.log('[1] Price the buyer saw:');
const p1 = await makeProduct(3);
const seenLine = line(p1);
await productService.updateProduct(p1.id, { price: 250000 }, seller.uid);
const priceErr = await rejects(orderService.createOrder({ buyer, items: [seenLine], deliveryAddress: address }));
assert(priceErr?.code === 'PRICE_CHANGED', 'Order rejected when the seller changed the price after the buyer saw it');
const stockAfterReject = (await productService.getProductById(p1.id)).stockQuantity;
assert(stockAfterReject === 3, 'Rejected checkout does not reserve stock');
const okOrder = await orderService.createOrder({ buyer, items: [line(p1, { price: 250000 })], deliveryAddress: address });
assert(okOrder.subtotal === 250000, 'Order goes through at the confirmed price');

console.log('\n[2] Delivery fee is computed, not trusted:');
const forged = await orderService.createOrder({ buyer, items: [line(p1, { price: 250000 })], deliveryAddress: address, deliveryFee: 0 });
assert(forged.deliveryFee === 30000, 'Caller-supplied deliveryFee: 0 is ignored');
assert(forged.totalAmount === forged.subtotal + forged.deliveryFee, 'Total = subtotal + delivery fee');
assert(calculateDeliveryFee([{ deliveryInfo: { shippingFeeEstimate: 25000 } }, { deliveryInfo: { shippingFeeEstimate: 40000 } }]) === 40000, 'One parcel per order: highest product estimate is charged');
assert(calculateDeliveryFee([]) === DEFAULT_SHIPPING_FEE, 'Falls back to the default fee');

console.log('\n[3] Double submit:');
const p3 = await makeProduct(5);
const checkoutId = 'chk_test_double_tap';
const [first, second] = await Promise.all([
  orderService.createOrder({ buyer, items: [line(p3)], deliveryAddress: address, checkoutId }),
  orderService.createOrder({ buyer, items: [line(p3)], deliveryAddress: address, checkoutId }),
]);
assert(first.id === second.id, 'Two taps with the same checkout id return the same order');
assert((await productService.getProductById(p3.id)).stockQuantity === 4, 'Stock reserved only once');
const buyerOrders = await orderService.getBuyerOrders(buyer.uid);
assert(buyerOrders.filter((o) => o.items[0].productId === p3.id).length === 1, 'Only one order stored');

console.log('\n[4] Order identity:');
assert(/^RM-\d{8}-[0-9A-Z]{6}$/.test(first.orderNumber), `Order number format RM-YYYYMMDD-XXXXXX (${first.orderNumber})`);
const numbers = new Set(buyerOrders.map((o) => o.orderNumber));
assert(numbers.size === buyerOrders.length, 'Order numbers are unique');

console.log('\n[5] Reservation released on shipping:');
const p5 = await makeProduct(2);
const o5 = await orderService.createOrder({ buyer, items: [line(p5)], deliveryAddress: address });
assert((await productService.getProductById(p5.id)).reservedQuantity === 1, 'Checkout reserves 1 unit');
await orderService.confirmOrder(o5.id, seller.uid);
await orderService.shipOrder(o5.id, seller.uid);
const shipped = await productService.getProductById(p5.id);
assert(shipped.reservedQuantity === 0 && shipped.stockQuantity === 1, 'Shipping releases the reservation, stock stays sold');

console.log('\n[6] Input validation:');
const noAddr = await rejects(orderService.createOrder({ buyer, items: [line(p5)], deliveryAddress: { recipientName: 'x' } }));
assert(Boolean(noAddr), 'Order without street/phone is rejected');
const badQty = await rejects(orderService.createOrder({ buyer, items: [line(p5, { quantity: 0 })], deliveryAddress: address }));
assert(Boolean(badQty), 'Quantity 0 is rejected');
assert(isValidVietnamesePhone('0912 345 678') && isValidVietnamesePhone('+84912345678'), 'Accepts formatted VN mobile numbers');
assert(!isValidVietnamesePhone('abc0912345678') && !isValidVietnamesePhone('0912345678999') && !isValidVietnamesePhone('0212345678'), 'Rejects junk, too-long and non-mobile numbers');

console.log('\n[7] Cart availability:');
const p7 = await makeProduct(1);
await cartService.clearCart();
await cartService.addToCart(await productService.getProductById(p7.id), 1, buyer.uid);
// Another buyer bought the last unit on their own device (synced stock update)
Object.assign(productService._getInternalStore().find((p) => p.id === p7.id), { stockQuantity: 0, status: 'sold_out' });
await cartService.addToCart(await productService.getProductById(p3.id), 1, buyer.uid);
const cart = await cartService.getCart();
const groups = cartService.groupItemsBySeller(cart);
const soldLine = cart.find((i) => i.productId === p7.id);
assert(soldLine && soldLine.isAvailable === false, 'Item sold to someone else is flagged unavailable in the cart');
assert(!groups[0].availableItems.some((i) => i.productId === p7.id), 'Unavailable item excluded from checkout items');
assert(groups[0].subtotal === p3.price, 'Group subtotal counts only purchasable items');

console.log('\n========================================');
console.log(`CHECKOUT TOTAL: ${total} | PASSED: ${total - failed} | FAILED: ${failed}`);
console.log('========================================\n');
if (failed > 0) process.exit(1);
