import { storage } from '../utils/storage.js';
import { productService } from './productService.js';

export const cartService = {
  // Get cart items with fresh product prices and stock validation
  async getCart() {
    const rawItems = await storage.getCart();
    const products = productService._getInternalStore();

    // Revalidate each item against current database
    const validatedItems = rawItems
      .map((item) => {
        const currentProd = products.find((p) => p.id === item.productId);
        if (!currentProd) return null; // product was deleted

        return {
          ...item,
          // Let the cart tell the buyer the price moved since it was added
          previousPrice: item.price !== currentProd.price ? item.price : undefined,
          productName: currentProd.name,
          primaryImage: currentProd.primaryImage,
          price: currentProd.price,
          sellerId: currentProd.sellerId,
          sellerName: currentProd.sellerName,
          categoryName: currentProd.categoryName,
          availableStock: currentProd.stockQuantity,
          isAvailable: currentProd.status === 'active' && currentProd.stockQuantity >= item.quantity,
        };
      })
      .filter(Boolean);

    await storage.saveCart(validatedItems);
    return validatedItems;
  },

  // Add product to cart
  async addToCart(product, quantity = 1, currentUserId) {
    if (product.sellerId === currentUserId) {
      throw new Error('Bạn không thể mua sản phẩm do chính mình đăng bán');
    }

    if (product.status !== 'active' || product.stockQuantity <= 0) {
      throw new Error('Sản phẩm này hiện đã hết hàng hoặc không khả dụng');
    }

    const currentItems = await storage.getCart();
    const existingIndex = currentItems.findIndex((i) => i.productId === product.id);

    if (existingIndex > -1) {
      const newQty = currentItems[existingIndex].quantity + quantity;
      if (newQty > product.stockQuantity) {
        throw new Error(`Người bán chỉ còn ${product.stockQuantity} sản phẩm trong kho`);
      }
      currentItems[existingIndex].quantity = newQty;
    } else {
      currentItems.push({
        productId: product.id,
        sellerId: product.sellerId,
        sellerName: product.sellerName,
        productName: product.name,
        primaryImage: product.primaryImage,
        price: product.price,
        quantity: Math.min(quantity, product.stockQuantity),
        categoryName: product.categoryName,
        conditionSnapshot: product.condition,
        addedAt: new Date().toISOString(),
      });
    }

    await storage.saveCart(currentItems);
    return currentItems;
  },

  // Update item quantity
  async updateQuantity(productId, quantity) {
    const currentItems = await storage.getCart();
    const item = currentItems.find((i) => i.productId === productId);
    if (!item) return currentItems;

    const products = productService._getInternalStore();
    const prod = products.find((p) => p.id === productId);

    if (quantity <= 0) {
      return this.removeFromCart(productId);
    }

    if (prod && quantity > prod.stockQuantity) {
      throw new Error(`Chỉ còn ${prod.stockQuantity} sản phẩm khả dụng`);
    }

    item.quantity = quantity;
    await storage.saveCart(currentItems);
    return currentItems;
  },

  // Remove item from cart
  async removeFromCart(productId) {
    const currentItems = await storage.getCart();
    const filtered = currentItems.filter((i) => i.productId !== productId);
    await storage.saveCart(filtered);
    return filtered;
  },

  // Remove the given products only (items actually placed in an order)
  async removeItems(productIds) {
    const currentItems = await storage.getCart();
    const remaining = currentItems.filter((i) => !productIds.includes(i.productId));
    await storage.saveCart(remaining);
    return remaining;
  },

  // Empty the cart (on logout, so the next account on this device starts clean)
  async clearCart() {
    await storage.saveCart([]);
    return [];
  },

  // Group cart items by seller to enforce 1-seller checkout rule
  groupItemsBySeller(cartItems) {
    const groups = {};
    cartItems.forEach((item) => {
      if (!groups[item.sellerId]) {
        groups[item.sellerId] = {
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          items: [],
          availableItems: [],
          subtotal: 0,
        };
      }
      groups[item.sellerId].items.push(item);
      // Sold-out / over-stock lines stay visible but are not checked out or totalled
      if (item.isAvailable !== false) {
        groups[item.sellerId].availableItems.push(item);
        groups[item.sellerId].subtotal += item.price * item.quantity;
      }
    });

    return Object.values(groups);
  },
};
