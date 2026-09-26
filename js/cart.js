/**
 * HerbaCart – Shopping Cart State Management
 * Persistent across sessions and pages via localStorage
 */

const Cart = {
  STORAGE_KEY: 'herbacart_cart_items',
  COUPON_KEY: 'herbacart_active_coupon',

  /**
   * Retrieve cart items from localStorage
   * @returns {Array<{productId: string, quantity: number}>}
   */
  getItems() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading cart from localStorage', e);
      return [];
    }
  },

  /**
   * Save cart items to localStorage and trigger update event
   */
  saveItems(items) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      this.notifyUpdate();
    } catch (e) {
      console.error('Error saving cart to localStorage', e);
    }
  },

  /**
   * Add a product to the cart with specified quantity
   */
  addItem(productId, quantity = 1) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) return false;

    const product = HERB_PRODUCTS.find(p => p.id === productId);
    if (!product) return false;

    const items = this.getItems();
    const existingIndex = items.findIndex(item => item.productId === productId);

    if (existingIndex > -1) {
      const newQty = items[existingIndex].quantity + qty;
      if (newQty > product.stockCount) {
        items[existingIndex].quantity = product.stockCount;
        this.saveItems(items);
        return { success: true, item: product, reachedMax: true };
      }
      items[existingIndex].quantity = newQty;
    } else {
      const initialQty = Math.min(qty, product.stockCount);
      items.push({ productId, quantity: initialQty });
    }

    this.saveItems(items);
    return { success: true, item: product, reachedMax: false };
  },

  /**
   * Update quantity of a product in the cart
   */
  updateQuantity(productId, newQty) {
    const qty = parseInt(newQty, 10);
    const items = this.getItems();
    const product = HERB_PRODUCTS.find(p => p.id === productId);

    if (isNaN(qty) || qty <= 0) {
      return this.removeItem(productId);
    }

    const item = items.find(i => i.productId === productId);
    if (item) {
      const maxStock = product ? product.stockCount : 99;
      item.quantity = Math.min(qty, maxStock);
      this.saveItems(items);
      return true;
    }
    return false;
  },

  /**
   * Remove a product from the cart completely
   */
  removeItem(productId) {
    let items = this.getItems();
    const prevLen = items.length;
    items = items.filter(item => item.productId !== productId);
    if (items.length !== prevLen) {
      this.saveItems(items);
      return true;
    }
    return false;
  },

  /**
   * Clear all items in the cart
   */
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.removeCoupon();
    this.notifyUpdate();
  },

  /**
   * Get total count of all herb items in cart
   */
  getTotalCount() {
    const items = this.getItems();
    return items.reduce((sum, item) => sum + item.quantity, 0);
  },

  /**
   * Get rich cart items populated with product details
   */
  getDetailedItems() {
    const items = this.getItems();
    return items.map(cartItem => {
      const product = HERB_PRODUCTS.find(p => p.id === cartItem.productId);
      if (!product) return null;
      return {
        ...product,
        quantity: cartItem.quantity,
        itemTotal: product.price * cartItem.quantity
      };
    }).filter(Boolean);
  },

  /**
   * Calculate financial figures: Subtotal, Shipping, Discount, Grand Total
   */
  getTotals() {
    const items = this.getDetailedItems();
    const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
    
    // Free delivery above ₹500, standard ₹40 otherwise
    const shippingThreshold = 500;
    const shipping = items.length === 0 ? 0 : (subtotal >= shippingThreshold ? 0 : 40);
    const freeShippingRemaining = Math.max(0, shippingThreshold - subtotal);

    // Coupon discount calculation
    let discount = 0;
    let couponInfo = null;
    const activeCouponCode = this.getCoupon();

    if (activeCouponCode && COUPONS[activeCouponCode]) {
      const coupon = COUPONS[activeCouponCode];
      if (!coupon.minTotal || subtotal >= coupon.minTotal) {
        discount = Math.round((subtotal * coupon.discountPercent) / 100);
        couponInfo = {
          code: activeCouponCode,
          percent: coupon.discountPercent,
          description: coupon.description,
          discountAmount: discount
        };
      } else {
        // Did not meet minimum
        this.removeCoupon();
      }
    }

    const grandTotal = Math.max(0, subtotal - discount + shipping);

    return {
      items,
      count: this.getTotalCount(),
      subtotal,
      shipping,
      discount,
      grandTotal,
      freeShippingRemaining,
      isFreeShipping: subtotal >= shippingThreshold,
      couponInfo
    };
  },

  /**
   * Coupon operations
   */
  getCoupon() {
    return localStorage.getItem(this.COUPON_KEY) || null;
  },

  applyCoupon(code) {
    if (!code) return { success: false, message: 'Please enter a coupon code.' };
    const cleanCode = code.trim().toUpperCase();
    const coupon = COUPONS[cleanCode];

    if (!coupon) {
      return { success: false, message: 'Invalid coupon code. Try HERBA10 or STUDENT15.' };
    }

    const subtotal = this.getItems().reduce((sum, item) => {
      const prod = HERB_PRODUCTS.find(p => p.id === item.productId);
      return sum + (prod ? prod.price * item.quantity : 0);
    }, 0);

    if (subtotal === 0) {
      return { success: false, message: 'Add herbs to your cart before applying a coupon.' };
    }

    if (coupon.minTotal && subtotal < coupon.minTotal) {
      return { 
        success: false, 
        message: `This coupon requires a minimum cart value of ₹${coupon.minTotal}.` 
      };
    }

    localStorage.setItem(this.COUPON_KEY, cleanCode);
    this.notifyUpdate();
    return { success: true, message: `Coupon ${cleanCode} applied! (${coupon.discountPercent}% off)` };
  },

  removeCoupon() {
    localStorage.removeItem(this.COUPON_KEY);
    this.notifyUpdate();
  },

  /**
   * Dispatch custom event to notify all components to re-render
   */
  notifyUpdate() {
    window.dispatchEvent(new CustomEvent('cartUpdated', {
      detail: {
        count: this.getTotalCount(),
        totals: this.getTotals()
      }
    }));
    this.updateBadge();
  },

  /**
   * Sync DOM badge immediately
   */
  updateBadge() {
    const count = this.getTotalCount();
    const badgeEls = document.querySelectorAll('.cart-badge-count');
    badgeEls.forEach(badge => {
      badge.textContent = count;
      if (count > 0) {
        badge.classList.add('has-items');
        badge.classList.add('bounce');
        setTimeout(() => badge.classList.remove('bounce'), 300);
      } else {
        badge.classList.remove('has-items');
      }
    });
  }
};

// Initialize badge immediately on load
document.addEventListener('DOMContentLoaded', () => {
  Cart.updateBadge();
});
