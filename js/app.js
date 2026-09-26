/**
 * HerbaCart – Main Application Logic & Router
 */

// Application State
const AppState = {
  currentRoute: 'home',
  searchQuery: '',
  selectedCategory: 'all',
  selectedPriceRange: 'all',
  sortBy: 'recommended',
  currentProductId: null,
  currentUser: null,
  upiVerified: false,
  upiTransaction: null,
  lastOrder: null
};

// =========================================================================
// ROUTER & NAVIGATION
// =========================================================================

function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}

function handleRouteChange() {
  const hash = window.location.hash.slice(1) || 'home';
  const [route, queryStr] = hash.split('?');
  const params = new URLSearchParams(queryStr || '');

  AppState.currentRoute = route;

  // Read URL query params if present
  if (route === 'products') {
    if (params.has('category')) {
      AppState.selectedCategory = params.get('category');
    }
    if (params.has('search')) {
      AppState.searchQuery = params.get('search');
    }
  } else if (route === 'product-details') {
    AppState.currentProductId = params.get('id') || 'tulsi';
  }

  // Hide all pages, show target page
  const pages = document.querySelectorAll('.page-view');
  pages.forEach(p => p.classList.remove('active'));

  const targetPage = document.getElementById(`page-${route}`);
  if (targetPage) {
    targetPage.classList.add('active');
  } else {
    // Fallback to home
    const homePage = document.getElementById('page-home');
    if (homePage) homePage.classList.add('active');
    AppState.currentRoute = 'home';
  }

  // Update navbar links active state
  updateNavLinks(route);

  // Render page-specific content
  renderActivePage(route);

  // Scroll to top smoothly
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Close mobile menu if open
  closeMobileMenu();
}

function navigateTo(route, params = {}) {
  const queryStr = Object.keys(params).length
    ? '?' + new URLSearchParams(params).toString()
    : '';
  window.location.hash = `#${route}${queryStr}`;
}

function updateNavLinks(route) {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const target = link.getAttribute('data-route');
    if (target === route) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

function renderActivePage(route) {
  switch (route) {
    case 'home':
      renderFeaturedHerbs();
      break;
    case 'products':
      renderProductsPage();
      break;
    case 'product-details':
      renderProductDetails(AppState.currentProductId);
      break;
    case 'cart':
      renderCartPage();
      break;
    case 'checkout':
      renderCheckoutPage();
      break;
    case 'confirmation':
    case 'order-confirmation':
      const savedOrder = AppState.lastOrder || (function() {
        try {
          const raw = localStorage.getItem('herbacart_last_order');
          return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
      })();
      if (savedOrder) {
        renderOrderConfirmation(savedOrder);
      } else {
        navigateTo('products');
      }
      break;
    case 'auth':
    case 'login':
      renderAuthPage();
      break;
    case 'about':
      // Static content, ensure smooth appearance
      break;
  }
}

// =========================================================================
// HOME PAGE RENDERING
// =========================================================================

function renderFeaturedHerbs() {
  const featuredContainer = document.getElementById('home-featured-grid');
  if (!featuredContainer) return;

  const featured = HERB_PRODUCTS.filter(p => p.featured).slice(0, 4);
  featuredContainer.innerHTML = featured.map(herb => createProductCardHtml(herb)).join('');
  attachProductCardEvents(featuredContainer);
}

// =========================================================================
// PRODUCTS PAGE RENDERING & FILTERS
// =========================================================================

function renderProductsPage() {
  // Sync filter UI controls with state
  const searchInput = document.getElementById('product-search-input');
  if (searchInput) searchInput.value = AppState.searchQuery;

  const sortSelect = document.getElementById('product-sort-select');
  if (sortSelect) sortSelect.value = AppState.sortBy;

  const priceSelect = document.getElementById('product-price-filter');
  if (priceSelect) priceSelect.value = AppState.selectedPriceRange;

  // Update category chips
  const categoryChips = document.querySelectorAll('.category-chip');
  categoryChips.forEach(chip => {
    const cat = chip.getAttribute('data-category');
    if (cat === AppState.selectedCategory) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  filterAndRenderProducts();
}

function filterAndRenderProducts() {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('product-count-display');
  const emptyState = document.getElementById('products-empty-state');
  if (!grid) return;

  let filtered = [...HERB_PRODUCTS];

  // 1. Category Filter
  if (AppState.selectedCategory && AppState.selectedCategory !== 'all') {
    filtered = filtered.filter(p => p.categoryId === AppState.selectedCategory);
  }

  // 2. Search Query Filter
  if (AppState.searchQuery.trim()) {
    const query = AppState.searchQuery.trim().toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.botanicalName.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.shortDescription.toLowerCase().includes(query) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(query)))
    );
  }

  // 3. Price Filter
  if (AppState.selectedPriceRange !== 'all') {
    switch (AppState.selectedPriceRange) {
      case 'under-200':
        filtered = filtered.filter(p => p.price < 200);
        break;
      case '200-250':
        filtered = filtered.filter(p => p.price >= 200 && p.price <= 250);
        break;
      case 'above-250':
        filtered = filtered.filter(p => p.price > 250);
        break;
    }
  }

  // 4. Sort
  switch (AppState.sortBy) {
    case 'price-low':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-high':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'name-asc':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'rating':
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case 'recommended':
    default:
      // Featured first, then rating
      filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.rating - a.rating);
      break;
  }

  // Update count indicator
  if (countEl) {
    countEl.textContent = `Showing ${filtered.length} of ${HERB_PRODUCTS.length} natural herbs`;
  }

  // Render cards or empty state
  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
  } else {
    if (emptyState) emptyState.classList.add('hidden');
    grid.innerHTML = filtered.map(herb => createProductCardHtml(herb)).join('');
    attachProductCardEvents(grid);
  }
}

// Generate Product Card HTML
function createProductCardHtml(herb) {
  const badgeHtml = herb.tags && herb.tags.length
    ? `<span class="product-badge">${herb.tags[0]}</span>`
    : '';

  return `
    <article class="herb-card" data-product-id="${herb.id}">
      <div class="card-media-wrapper">
        <img 
          src="${herb.image}" 
          alt="${herb.name}" 
          class="herb-img"
          loading="lazy"
          onerror="this.onerror=null; this.src='assets/images/tulsi.jpg';"
        />
        ${badgeHtml}
        <button class="quick-view-btn" data-product-id="${herb.id}" title="Quick Details">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>

      <div class="card-content">
        <div class="card-meta">
          <span class="herb-category-pill">${herb.category}</span>
          <span class="herb-rating">★ ${herb.rating}</span>
        </div>

        <h3 class="herb-title">${herb.name}</h3>
        <p class="herb-botanical"><em>${herb.botanicalName}</em></p>
        <p class="herb-desc">${herb.shortDescription}</p>

        <div class="card-footer">
          <div class="price-container">
            <span class="currency-symbol">₹</span><span class="herb-price">${herb.price}</span>
            ${herb.originalPrice ? `<span class="herb-original-price">₹${herb.originalPrice}</span>` : ''}
            <span class="herb-weight">${herb.weight}</span>
          </div>

          <div class="card-actions">
            <button class="btn btn-outline btn-sm view-details-btn" data-product-id="${herb.id}">
              Details
            </button>
            <button class="btn btn-primary btn-sm add-cart-btn" data-product-id="${herb.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function attachProductCardEvents(container) {
  // View Details Click
  container.querySelectorAll('.view-details-btn, .quick-view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-product-id');
      navigateTo('product-details', { id });
    });
  });

  // Clicking the card image or title opens details
  container.querySelectorAll('.card-media-wrapper, .herb-title').forEach(el => {
    el.addEventListener('click', () => {
      const card = el.closest('.herb-card');
      const id = card.getAttribute('data-product-id');
      navigateTo('product-details', { id });
    });
  });

  // Add to Cart Click
  container.querySelectorAll('.add-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-product-id');
      const result = Cart.addItem(id, 1);
      if (result.success) {
        showToast(`🌿 Added ${result.item.name} to cart!`, 'success');
        // Visual button feedback
        const origText = btn.innerHTML;
        btn.classList.add('btn-added');
        btn.innerHTML = `✓ Added!`;
        setTimeout(() => {
          btn.classList.remove('btn-added');
          btn.innerHTML = origText;
        }, 1200);
      }
    });
  });
}

// =========================================================================
// PRODUCT DETAILS PAGE RENDERING
// =========================================================================

function renderProductDetails(productId) {
  const container = document.getElementById('product-details-container');
  if (!container) return;

  const herb = HERB_PRODUCTS.find(p => p.id === productId) || HERB_PRODUCTS[0];

  container.innerHTML = `
    <div class="details-breadcrumbs">
      <a href="#home">Home</a> <span>/</span>
      <a href="#products">Medicinal Herbs</a> <span>/</span>
      <span class="active">${herb.name}</span>
    </div>

    <div class="product-details-layout">
      <!-- Media Column -->
      <div class="details-media-col">
        <div class="details-image-frame">
          <img 
            src="${herb.image}" 
            alt="${herb.name}" 
            class="details-main-img"
            onerror="this.onerror=null; this.src='assets/images/tulsi.jpg';"
          />
          <span class="details-badge">${herb.category}</span>
        </div>

        <div class="details-trust-badges">
          <div class="trust-badge-item">
            <span class="badge-icon">🌿</span>
            <div class="badge-text">
              <strong>100% Pure</strong>
              <small>Zero synthetics</small>
            </div>
          </div>
          <div class="trust-badge-item">
            <span class="badge-icon">🧪</span>
            <div class="badge-text">
              <strong>Lab Tested</strong>
              <small>Heavy metal safe</small>
            </div>
          </div>
          <div class="trust-badge-item">
            <span class="badge-icon">🌱</span>
            <div class="badge-text">
              <strong>Ethical Harvest</strong>
              <small>Fair student trade</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Content Column -->
      <div class="details-info-col">
        <div class="details-header">
          <span class="botanical-tag">Botanical: <em>${herb.botanicalName}</em></span>
          <h1 class="details-title">${herb.name}</h1>
          <div class="details-rating-row">
            <span class="star-rating">★★★★★</span>
            <span class="rating-num">${herb.rating}</span>
            <span class="reviews-count">(${herb.reviewsCount} customer ratings)</span>
            <span class="stock-pill ${herb.inStock ? 'in-stock' : 'out-of-stock'}">
              ${herb.inStock ? `● In Stock (${herb.stockCount} units available)` : 'Out of Stock'}
            </span>
          </div>
        </div>

        <div class="details-price-box">
          <div class="price-main">
            <span class="currency">₹</span><span class="amount">${herb.price}</span>
            ${herb.originalPrice ? `<span class="original">₹${herb.originalPrice}</span>` : ''}
            <span class="tax-note">(Inclusive of all taxes)</span>
          </div>
          <span class="net-weight">Pack Size: <strong>${herb.weight}</strong></span>
        </div>

        <div class="details-description">
          <p class="lead-text">${herb.shortDescription}</p>
          <p class="body-text">${herb.fullDescription}</p>
        </div>

        <div class="details-benefits-card">
          <h4>Key Medicinal Health Benefits:</h4>
          <ul class="benefits-checklist">
            ${herb.keyBenefits.map(b => `<li><span class="check-icon">✓</span> ${b}</li>`).join('')}
          </ul>
        </div>

        <div class="details-usage-box">
          <strong>Suggested Dosage & Preparation:</strong>
          <p>${herb.howToUse}</p>
        </div>

        <div class="details-ayurveda-box">
          <strong>Ayurvedic Energetics:</strong>
          <p><code>${herb.ayurvedicProperties}</code></p>
        </div>

        <!-- Quantity & Add to Cart -->
        <div class="details-purchase-bar">
          <div class="quantity-controller">
            <button class="qty-btn" id="details-qty-minus" aria-label="Decrease quantity">−</button>
            <input type="number" id="details-qty-input" value="1" min="1" max="${herb.stockCount}" readonly />
            <button class="qty-btn" id="details-qty-plus" aria-label="Increase quantity">+</button>
          </div>

          <button class="btn btn-primary btn-lg" id="details-add-cart-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Add to Cart
          </button>

          <button class="btn btn-secondary btn-lg" id="details-buy-now-btn">
            Buy Now
          </button>
        </div>
      </div>
    </div>

    <!-- Related Herbs Section -->
    <section class="related-herbs-section">
      <div class="section-header-compact">
        <h2>You May Also Like</h2>
        <p>Complementary natural herbs for whole-body vitality</p>
      </div>
      <div class="related-grid" id="related-herbs-grid"></div>
    </section>
  `;

  // Attach quantity selector controls
  const minusBtn = document.getElementById('details-qty-minus');
  const plusBtn = document.getElementById('details-qty-plus');
  const qtyInput = document.getElementById('details-qty-input');
  const addBtn = document.getElementById('details-add-cart-btn');
  const buyNowBtn = document.getElementById('details-buy-now-btn');

  if (minusBtn && plusBtn && qtyInput) {
    minusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10);
      if (val > 1) qtyInput.value = val - 1;
    });

    plusBtn.addEventListener('click', () => {
      let val = parseInt(qtyInput.value, 10);
      if (val < herb.stockCount) qtyInput.value = val + 1;
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const qty = parseInt(qtyInput.value, 10) || 1;
      const res = Cart.addItem(herb.id, qty);
      if (res.success) {
        showToast(`🌿 Added ${qty}x ${herb.name} to cart!`, 'success');
        const orig = addBtn.innerHTML;
        addBtn.innerHTML = `✓ Added to Cart!`;
        setTimeout(() => addBtn.innerHTML = orig, 1500);
      }
    });
  }

  if (buyNowBtn) {
    buyNowBtn.addEventListener('click', () => {
      const qty = parseInt(qtyInput.value, 10) || 1;
      Cart.addItem(herb.id, qty);
      navigateTo('checkout');
    });
  }

  // Render related herbs (same category or others)
  const relatedGrid = document.getElementById('related-herbs-grid');
  if (relatedGrid) {
    const related = HERB_PRODUCTS
      .filter(p => p.id !== herb.id)
      .slice(0, 3);
    relatedGrid.innerHTML = related.map(h => createProductCardHtml(h)).join('');
    attachProductCardEvents(relatedGrid);
  }
}

// =========================================================================
// SHOPPING CART PAGE RENDERING
// =========================================================================

function renderCartPage() {
  const container = document.getElementById('cart-page-container');
  if (!container) return;

  const totals = Cart.getTotals();
  const items = totals.items;

  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-view">
        <div class="empty-icon-bubble">🌿</div>
        <h2>Your Herbal Cart is Empty</h2>
        <p>Explore our pure, nature-harvested botanicals and start your wellness journey today.</p>
        <a href="#products" class="btn btn-primary btn-lg">
          Explore Medicinal Herbs
        </a>
      </div>
    `;
    return;
  }

  // Free shipping progress indicator
  const progressPercent = Math.min(100, Math.round((totals.subtotal / 500) * 100));
  const shippingMsg = totals.isFreeShipping
    ? `<span class="shipping-success">🎉 Congratulations! You have unlocked <strong>FREE Shipping</strong>!</span>`
    : `Add <strong>₹${totals.freeShippingRemaining}</strong> more to qualify for <strong>FREE Delivery</strong>`;

  container.innerHTML = `
    <div class="cart-page-header">
      <h1>Shopping Cart (${totals.count} ${totals.count === 1 ? 'item' : 'items'})</h1>
      <button class="btn btn-text text-danger" id="clear-cart-btn">Clear Cart</button>
    </div>

    <!-- Free Delivery Progress Bar -->
    <div class="shipping-progress-banner">
      <div class="shipping-text">${shippingMsg}</div>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${progressPercent}%;"></div>
      </div>
    </div>

    <div class="cart-layout-grid">
      <!-- Items Table / List -->
      <div class="cart-items-column">
        <div class="cart-items-card">
          ${items.map(item => `
            <div class="cart-item-row" data-product-id="${item.id}">
              <div class="cart-item-thumb">
                <img 
                  src="${item.image}" 
                  alt="${item.name}"
                  onerror="this.onerror=null; this.src='assets/images/tulsi.jpg';" 
                />
              </div>

              <div class="cart-item-info">
                <h3 class="cart-item-name">
                  <a href="#product-details?id=${item.id}">${item.name}</a>
                </h3>
                <span class="cart-item-meta">${item.weight} • ${item.category}</span>
                <span class="cart-item-unit-price">₹${item.price} each</span>
              </div>

              <div class="cart-item-quantity">
                <button class="item-qty-btn cart-qty-minus" data-product-id="${item.id}" aria-label="Decrease">−</button>
                <span class="item-qty-val">${item.quantity}</span>
                <button class="item-qty-btn cart-qty-plus" data-product-id="${item.id}" aria-label="Increase">+</button>
              </div>

              <div class="cart-item-total">
                ₹${item.itemTotal}
              </div>

              <button class="cart-item-remove-btn" data-product-id="${item.id}" title="Remove item" aria-label="Remove">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>

        <div class="cart-continue-bar">
          <a href="#products" class="btn btn-outline">
            ← Continue Shopping
          </a>
        </div>
      </div>

      <!-- Order Summary Column -->
      <div class="cart-summary-column">
        <div class="summary-card">
          <h2 class="summary-title">Order Summary</h2>

          <div class="summary-row">
            <span>Items Subtotal</span>
            <span>₹${totals.subtotal}</span>
          </div>

          <div class="summary-row">
            <span>Standard Eco Delivery</span>
            <span>${totals.shipping === 0 ? '<span class="text-free">FREE</span>' : `₹${totals.shipping}`}</span>
          </div>

          ${totals.couponInfo ? `
            <div class="summary-row discount-row">
              <span>
                Discount (${totals.couponInfo.code} - ${totals.couponInfo.percent}%)
                <button class="remove-coupon-link" id="remove-coupon-btn" title="Remove coupon">✕</button>
              </span>
              <span class="text-discount">- ₹${totals.discount}</span>
            </div>
          ` : ''}

          <hr class="summary-divider" />

          <!-- Coupon Input Form -->
          <div class="coupon-section">
            <label for="coupon-code-input" class="coupon-label">Have a promo code?</label>
            <div class="coupon-input-group">
              <input 
                type="text" 
                id="coupon-code-input" 
                placeholder="e.g. HERBA10" 
                value="${totals.couponInfo ? totals.couponInfo.code : ''}"
                ${totals.couponInfo ? 'disabled' : ''}
              />
              <button 
                class="btn btn-secondary btn-sm" 
                id="apply-coupon-btn"
                ${totals.couponInfo ? 'disabled' : ''}
              >
                Apply
              </button>
            </div>
            <div class="coupon-suggestions">
              <small>Try: <code class="coupon-pill" data-code="HERBA10">HERBA10</code> (10% off) or <code class="coupon-pill" data-code="STUDENT15">STUDENT15</code> (15% off)</small>
            </div>
          </div>

          <hr class="summary-divider" />

          <div class="summary-total-row">
            <span>Grand Total</span>
            <span class="grand-total-amount">₹${totals.grandTotal}</span>
          </div>

          <a href="#checkout" class="btn btn-primary btn-block btn-lg checkout-cta-btn">
            Proceed to Checkout →
          </a>

          <div class="summary-guarantee-note">
            <span>🛡️ 100% Secure Checkout</span>
            <span>🌱 Biodegradable Packaging</span>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Cart Page Events
  // Quantity Minus
  container.querySelectorAll('.cart-qty-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-product-id');
      const item = items.find(i => i.id === id);
      if (item) {
        Cart.updateQuantity(id, item.quantity - 1);
        renderCartPage();
      }
    });
  });

  // Quantity Plus
  container.querySelectorAll('.cart-qty-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-product-id');
      const item = items.find(i => i.id === id);
      if (item) {
        Cart.updateQuantity(id, item.quantity + 1);
        renderCartPage();
      }
    });
  });

  // Remove Item
  container.querySelectorAll('.cart-item-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-product-id');
      const item = items.find(i => i.id === id);
      Cart.removeItem(id);
      showToast(`Removed ${item ? item.name : 'herb'} from cart.`, 'info');
      renderCartPage();
    });
  });

  // Clear Cart
  const clearBtn = document.getElementById('clear-cart-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to empty your herbal cart?')) {
        Cart.clear();
        showToast('Cart emptied.', 'info');
        renderCartPage();
      }
    });
  }

  // Apply Coupon
  const applyCouponBtn = document.getElementById('apply-coupon-btn');
  const couponInput = document.getElementById('coupon-code-input');
  if (applyCouponBtn && couponInput) {
    applyCouponBtn.addEventListener('click', () => {
      const code = couponInput.value;
      const res = Cart.applyCoupon(code);
      if (res.success) {
        showToast(res.message, 'success');
        renderCartPage();
      } else {
        showToast(res.message, 'error');
      }
    });
  }

  // Clickable coupon pills
  container.querySelectorAll('.coupon-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      if (couponInput && !couponInput.disabled) {
        couponInput.value = pill.getAttribute('data-code');
        applyCouponBtn.click();
      }
    });
  });

  // Remove Coupon
  const removeCouponBtn = document.getElementById('remove-coupon-btn');
  if (removeCouponBtn) {
    removeCouponBtn.addEventListener('click', () => {
      Cart.removeCoupon();
      showToast('Coupon removed.', 'info');
      renderCartPage();
    });
  }
}

// =========================================================================
// CHECKOUT PAGE RENDERING & ORDER CONFIRMATION
// =========================================================================

function renderCheckoutPage() {
  const container = document.getElementById('checkout-page-container');
  if (!container) return;

  const totals = Cart.getTotals();
  const items = totals.items;

  // If cart is empty, redirect
  if (items.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-view">
        <div class="empty-icon-bubble">🌿</div>
        <h2>No herbs in your cart for checkout</h2>
        <p>Please select your natural remedies before proceeding.</p>
        <a href="#products" class="btn btn-primary btn-lg">Browse Products</a>
      </div>
    `;
    return;
  }

  // Pre-fill user details if logged in
  const user = getSavedUser();

  container.innerHTML = `
    <div class="checkout-header-bar">
      <h1>Secure Checkout</h1>
      <div class="checkout-steps-badge">
        <span>Cart</span> &gt; <strong class="text-primary">Checkout</strong> &gt; <span>Confirmation</span>
      </div>
    </div>

    <div class="checkout-layout-grid">
      <!-- Checkout Form Column -->
      <div class="checkout-form-column">
        <form id="checkout-form" class="checkout-form" novalidate>
          <!-- Customer Contact -->
          <div class="form-section-card">
            <h2 class="form-section-title">
              <span class="step-num">1</span> Customer Contact
            </h2>
            <div class="form-grid-2">
              <div class="form-group">
                <label for="checkout-name">Full Name <span class="required">*</span></label>
                <input type="text" id="checkout-name" name="name" required placeholder="e.g. Rahul Sharma" value="${user ? user.name : ''}" />
                <span class="field-error" id="error-name"></span>
              </div>
              <div class="form-group">
                <label for="checkout-email">Email Address <span class="required">*</span></label>
                <input type="email" id="checkout-email" name="email" required placeholder="e.g. rahul@example.com" value="${user ? user.email : ''}" />
                <span class="field-error" id="error-email"></span>
              </div>
            </div>
            <div class="form-group">
              <label for="checkout-phone">Phone Number (10 digits) <span class="required">*</span></label>
              <div class="phone-input-wrapper">
                <span class="phone-prefix">+91</span>
                <input type="tel" id="checkout-phone" name="phone" required placeholder="9876543210" maxlength="10" />
              </div>
              <span class="field-error" id="error-phone"></span>
            </div>
          </div>

          <!-- Shipping Address -->
          <div class="form-section-card">
            <h2 class="form-section-title">
              <span class="step-num">2</span> Delivery Address
            </h2>
            <div class="form-group">
              <label for="checkout-address">Street Address, Flat / House No. <span class="required">*</span></label>
              <input type="text" id="checkout-address" name="address" required placeholder="House No. 12, Greenfield Colony, 3rd Cross" />
              <span class="field-error" id="error-address"></span>
            </div>

            <div class="form-grid-3">
              <div class="form-group">
                <label for="checkout-city">City <span class="required">*</span></label>
                <input type="text" id="checkout-city" name="city" required placeholder="Bengaluru" />
                <span class="field-error" id="error-city"></span>
              </div>
              <div class="form-group">
                <label for="checkout-state">State <span class="required">*</span></label>
                <select id="checkout-state" name="state" required>
                  <option value="">Select State</option>
                  <option value="Karnataka" selected>Karnataka</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi NCR</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Other">Other State</option>
                </select>
                <span class="field-error" id="error-state"></span>
              </div>
              <div class="form-group">
                <label for="checkout-pincode">PIN Code (6 digits) <span class="required">*</span></label>
                <input type="text" id="checkout-pincode" name="pincode" required placeholder="560001" maxlength="6" />
                <span class="field-error" id="error-pincode"></span>
              </div>
            </div>

            <div class="form-group">
              <label for="checkout-notes">Delivery Instructions (Optional)</label>
              <input type="text" id="checkout-notes" name="notes" placeholder="e.g. Leave with security, call upon arrival" />
            </div>
          </div>

          <!-- Payment Options -->
          <div class="form-section-card">
            <h2 class="form-section-title">
              <span class="step-num">3</span> Payment Method
            </h2>

            <div class="payment-options-grid">
              <label class="payment-card selected" id="card-option-cod">
                <input type="radio" name="paymentMethod" value="cod" checked />
                <div class="payment-card-content">
                  <span class="payment-icon">💵</span>
                  <div>
                    <strong>Cash on Delivery (COD)</strong>
                    <small>Pay with cash or UPI upon delivery</small>
                  </div>
                </div>
              </label>

              <label class="payment-card" id="card-option-upi">
                <input type="radio" name="paymentMethod" value="upi" />
                <div class="payment-card-content">
                  <span class="payment-icon">📱</span>
                  <div>
                    <strong>UPI / QR Code</strong>
                    <small>Instant scan with GPay, PhonePe, Paytm & Random Scanner</small>
                  </div>
                </div>
              </label>

              <!-- Dynamic UPI QR Code & Random Scanner Section -->
              <div class="upi-qr-box hidden" id="upi-qr-box">
                <div class="upi-qr-header">
                  <div class="upi-header-text">
                    <h4>Scan & Pay with any UPI App</h4>
                    <p class="upi-subtext">Scan the QR code below or test our interactive Random Scanner simulator.</p>
                  </div>
                  <span class="upi-amount-pill">Amount: ₹${totals.grandTotal}</span>
                </div>

                <div class="upi-qr-content-grid">
                  <!-- QR Code Display Box -->
                  <div class="qr-code-frame">
                    <div class="qr-target-corners">
                      <span class="corner top-left"></span>
                      <span class="corner top-right"></span>
                      <span class="corner bottom-left"></span>
                      <span class="corner bottom-right"></span>
                      <img 
                        src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi%3A%2F%2Fpay%3Fpa%3Dherbacart%40upi%26pn%3DHerbaCart%2520Store%26am%3D${totals.grandTotal}%26cu%3DINR" 
                        alt="UPI Payment QR Code" 
                        class="qr-code-image"
                        id="checkout-qr-img"
                        onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 200\' width=\'200\' height=\'200\' fill=\'%232d5a3a\'><rect width=\'200\' height=\'200\' fill=\'%23ffffff\'/><rect x=\'20\' y=\'20\' width=\'50\' height=\'50\' fill=\'%232d5a3a\'/><rect x=\'30\' y=\'30\' width=\'30\' height=\'30\' fill=\'%23ffffff\'/><rect x=\'38\' y=\'38\' width=\'14\' height=\'14\' fill=\'%232d5a3a\'/><rect x=\'130\' y=\'20\' width=\'50\' height=\'50\' fill=\'%232d5a3a\'/><rect x=\'140\' y=\'30\' width=\'30\' height=\'30\' fill=\'%23ffffff\'/><rect x=\'148\' y=\'38\' width=\'14\' height=\'14\' fill=\'%232d5a3a\'/><rect x=\'20\' y=\'130\' width=\'50\' height=\'50\' fill=\'%232d5a3a\'/><rect x=\'30\' y=\'140\' width=\'30\' height=\'30\' fill=\'%23ffffff\'/><rect x=\'38\' y=\'148\' width=\'14\' height=\'14\' fill=\'%232d5a3a\'/><rect x=\'85\' y=\'20\' width=\'25\' height=\'25\' fill=\'%232d5a3a\'/><rect x=\'85\' y=\'60\' width=\'25\' height=\'25\' fill=\'%232d5a3a\'/><rect x=\'130\' y=\'85\' width=\'25\' height=\'25\' fill=\'%232d5a3a\'/><rect x=\'85\' y=\'120\' width=\'30\' height=\'30\' fill=\'%232d5a3a\'/><rect x=\'125\' y=\'125\' width=\'25\' height=\'25\' fill=\'%232d5a3a\'/><rect x=\'155\' y=\'155\' width=\'25\' height=\'25\' fill=\'%232d5a3a\'/><text x=\'100\' y=\'105\' font-family=\'sans-serif\' font-size=\'10\' font-weight=\'bold\' fill=\'%232d5a3a\' text-anchor=\'middle\'>HERBACART</text></svg>';"
                      />
                    </div>
                    <span class="qr-label">Scan with Google Pay, PhonePe, Paytm, or BHIM</span>
                  </div>

                  <!-- Details & Scanner Controls -->
                  <div class="upi-actions-panel">
                    <div class="upi-vpa-row">
                      <span class="upi-id-label">UPI ID:</span>
                      <strong class="upi-id-value" id="upi-id-text">herbacart@upi</strong>
                      <button type="button" class="btn btn-outline btn-sm copy-upi-btn" id="copy-upi-btn">
                        📋 Copy ID
                      </button>
                    </div>

                    <div class="upi-supported-apps">
                      <small>Supported Apps:</small>
                      <div class="apps-badges-row">
                        <span class="app-chip app-gpay">Google Pay</span>
                        <span class="app-chip app-phonepe">PhonePe</span>
                        <span class="app-chip app-paytm">Paytm</span>
                        <span class="app-chip app-bhim">BHIM</span>
                        <span class="app-chip app-cred">CRED</span>
                      </div>
                    </div>

                    <!-- Random Scanner Trigger Card -->
                    <div class="random-scanner-trigger-card">
                      <div class="scanner-trigger-info">
                        <span class="scanner-icon-bubble">📷</span>
                        <div>
                          <strong>Random Scanner Simulator</strong>
                          <p>Click below to test scanning this QR code with a live viewfinder simulator and random UPI app selection!</p>
                        </div>
                      </div>
                      <button type="button" class="btn btn-secondary btn-block" id="open-random-scanner-btn">
                        ⚡ Open Random Scanner Simulator
                      </button>
                    </div>

                    <!-- Verified Banner -->
                    <div class="upi-verified-alert ${AppState.upiVerified ? '' : 'hidden'}" id="upi-verified-alert">
                      <span class="verified-icon">✓</span>
                      <div>
                        <strong>Payment Verified via <span id="verified-app-name">${AppState.upiTransaction ? AppState.upiTransaction.app : 'UPI'}</span>!</strong>
                        <p>Transaction Ref: <code id="verified-ref-no">${AppState.upiTransaction ? AppState.upiTransaction.refNo : ''}</code></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <label class="payment-card" id="card-option-card">
                <input type="radio" name="paymentMethod" value="card" />
                <div class="payment-card-content">
                  <span class="payment-icon">💳</span>
                  <div>
                    <strong>Debit / Credit Card</strong>
                    <small>Visa, Mastercard, RuPay with live virtual card</small>
                  </div>
                </div>
              </label>

              <!-- Interactive Debit Card Payment Form -->
              <div class="debit-card-box hidden" id="debit-card-box">
                <div class="debit-card-header">
                  <div>
                    <h4>Enter Debit Card Details</h4>
                    <p class="debit-card-subtext">Safe & 256-bit encrypted simulated transaction.</p>
                  </div>
                  <div class="card-network-badges">
                    <span class="card-badge-chip">Visa</span>
                    <span class="card-badge-chip">Mastercard</span>
                    <span class="card-badge-chip">RuPay</span>
                  </div>
                </div>

                <!-- Live Card Graphic Preview -->
                <div class="virtual-card-preview" id="virtual-card-preview">
                  <div class="virtual-card-top-row">
                    <div class="virtual-card-chip"></div>
                    <div class="virtual-card-type" id="virtual-card-type">DEBIT CARD</div>
                  </div>
                  <div class="virtual-card-number" id="preview-card-number">•••• •••• •••• ••••</div>
                  <div class="virtual-card-bottom">
                    <div class="virtual-card-holder">
                      <small>CARDHOLDER NAME</small>
                      <span id="preview-card-name">YOUR NAME</span>
                    </div>
                    <div class="virtual-card-expiry">
                      <small>EXPIRES</small>
                      <span id="preview-card-expiry">MM/YY</span>
                    </div>
                  </div>
                </div>

                <div class="card-inputs-grid">
                  <div class="form-group">
                    <label for="card-holder-name">Cardholder Full Name <span class="required">*</span></label>
                    <input type="text" id="card-holder-name" name="cardHolderName" placeholder="e.g. Rahul Sharma" autocomplete="cc-name" />
                    <span class="field-error" id="error-card-name"></span>
                  </div>

                  <div class="form-group">
                    <label for="card-number-input">Debit Card Number (16 digits) <span class="required">*</span></label>
                    <div class="card-input-wrapper">
                      <span class="card-input-icon">💳</span>
                      <input type="text" id="card-number-input" name="cardNumber" placeholder="4532 8921 7842 1092" maxlength="19" autocomplete="cc-number" />
                    </div>
                    <span class="field-error" id="error-card-number"></span>
                  </div>

                  <div class="form-grid-2">
                    <div class="form-group">
                      <label for="card-expiry-input">Expiry Date <span class="required">*</span></label>
                      <input type="text" id="card-expiry-input" name="cardExpiry" placeholder="MM / YY" maxlength="7" autocomplete="cc-exp" />
                      <span class="field-error" id="error-card-expiry"></span>
                    </div>

                    <div class="form-group">
                      <label for="card-cvv-input">CVV / Security Code <span class="required">*</span></label>
                      <div class="cvv-input-wrapper">
                        <input type="password" id="card-cvv-input" name="cardCvv" placeholder="•••" maxlength="4" autocomplete="cc-csc" />
                        <span class="cvv-hint" title="3-digit security code on the back of your card">ℹ️ 3 digits</span>
                      </div>
                      <span class="field-error" id="error-card-cvv"></span>
                    </div>
                  </div>

                  <!-- Quick Demo Fill Button -->
                  <div class="demo-card-fill-row">
                    <button type="button" class="btn btn-outline btn-sm" id="fill-demo-card-btn">
                      ⚡ Fill Demo Card Details (1-Click)
                    </button>
                    <small class="demo-card-note">Simulated secure payment for student project</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Place Order Button -->
          <div class="checkout-submit-bar">
            <button type="submit" class="btn btn-primary btn-block btn-xl" id="place-order-btn">
              🌿 Place Order (₹${totals.grandTotal})
            </button>
            <p class="order-notice-text">
              ✨ HerbaCart is a student academic project. This is a functional simulation and no real charges are incurred.
            </p>
          </div>
        </form>
      </div>

      <!-- Order Review Sidebar -->
      <div class="checkout-review-column">
        <div class="review-order-card">
          <h3>Order Review (${totals.count})</h3>

          <div class="checkout-items-list">
            ${items.map(item => `
              <div class="checkout-item-mini">
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.src='assets/images/tulsi.jpg';" />
                <div class="mini-info">
                  <strong>${item.name}</strong>
                  <span class="mini-meta">${item.weight} • Qty: ${item.quantity}</span>
                </div>
                <div class="mini-price">₹${item.itemTotal}</div>
              </div>
            `).join('')}
          </div>

          <div class="checkout-breakdown">
            <div class="checkout-line">
              <span>Items Total</span>
              <span>₹${totals.subtotal}</span>
            </div>
            <div class="checkout-line">
              <span>Delivery</span>
              <span>${totals.shipping === 0 ? '<span class="text-free">FREE</span>' : `₹${totals.shipping}`}</span>
            </div>
            ${totals.couponInfo ? `
              <div class="checkout-line text-discount">
                <span>Discount (${totals.couponInfo.code})</span>
                <span>- ₹${totals.discount}</span>
              </div>
            ` : ''}
            <hr class="summary-divider" />
            <div class="checkout-line checkout-grand-total">
              <strong>Total Payable</strong>
              <strong class="text-primary">₹${totals.grandTotal}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Checkout Form Events
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    const paymentCards = checkoutForm.querySelectorAll('.payment-card');
    const upiQrBox = document.getElementById('upi-qr-box');
    const debitCardBox = document.getElementById('debit-card-box');
    const copyUpiBtn = document.getElementById('copy-upi-btn');
    const openScannerBtn = document.getElementById('open-random-scanner-btn');

    paymentCards.forEach(card => {
      card.addEventListener('click', () => {
        paymentCards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        const radio = card.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;

        // Toggle payment boxes
        if (radio && radio.value === 'upi') {
          if (upiQrBox) upiQrBox.classList.remove('hidden');
          if (debitCardBox) debitCardBox.classList.add('hidden');
        } else if (radio && radio.value === 'card') {
          if (debitCardBox) debitCardBox.classList.remove('hidden');
          if (upiQrBox) upiQrBox.classList.add('hidden');
        } else {
          if (upiQrBox) upiQrBox.classList.add('hidden');
          if (debitCardBox) debitCardBox.classList.add('hidden');
        }
      });
    });

    // Copy UPI ID button
    if (copyUpiBtn) {
      copyUpiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (navigator.clipboard) {
          navigator.clipboard.writeText('herbacart@upi').then(() => {
            showToast('📋 UPI ID herbacart@upi copied to clipboard!', 'info');
          }).catch(() => {
            showToast('UPI ID: herbacart@upi', 'info');
          });
        } else {
          showToast('UPI ID: herbacart@upi', 'info');
        }
      });
    }

    // Open Random Scanner button
    if (openScannerBtn) {
      openScannerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openRandomScannerModal(totals.grandTotal);
      });
    }

    // Setup Debit Card Input Live Syncing
    setupDebitCardInputs();

    checkoutForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateCheckoutForm()) {
        processOrderSubmission(totals);
      }
    });
  }
}

// Format and sync live virtual card preview
function setupDebitCardInputs() {
  const numInput = document.getElementById('card-number-input');
  const nameInput = document.getElementById('card-holder-name');
  const expInput = document.getElementById('card-expiry-input');
  const previewNum = document.getElementById('preview-card-number');
  const previewName = document.getElementById('preview-card-name');
  const previewExp = document.getElementById('preview-card-expiry');
  const previewType = document.getElementById('virtual-card-type');
  const demoCardBtn = document.getElementById('fill-demo-card-btn');

  // Live Card Number Formatting
  if (numInput && previewNum) {
    numInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 16) val = val.substring(0, 16);

      // Add spaces every 4 digits
      const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
      e.target.value = formatted;

      previewNum.textContent = formatted || '•••• •••• •••• ••••';

      // Detect Brand
      const brand = detectCardBrand(val);
      if (previewType) {
        previewType.textContent = brand.toUpperCase() + ' DEBIT';
      }
    });
  }

  // Live Name Formatting
  if (nameInput && previewName) {
    nameInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      previewName.textContent = val ? val.toUpperCase() : 'YOUR NAME';
    });
  }

  // Live Expiry Formatting (MM/YY)
  if (expInput && previewExp) {
    expInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 4) val = val.substring(0, 4);

      if (val.length >= 2) {
        e.target.value = val.substring(0, 2) + ' / ' + val.substring(2);
      } else {
        e.target.value = val;
      }
      previewExp.textContent = e.target.value || 'MM/YY';
    });
  }

  // Fill Demo Card Details button
  if (demoCardBtn) {
    demoCardBtn.addEventListener('click', () => {
      const custName = document.getElementById('checkout-name')?.value.trim() || 'Rahul Sharma';
      if (nameInput) nameInput.value = custName;
      if (numInput) numInput.value = '4532 8921 7842 1092';
      if (expInput) expInput.value = '11 / 29';
      const cvvInput = document.getElementById('card-cvv-input');
      if (cvvInput) cvvInput.value = '842';

      // Update previews
      if (previewName) previewName.textContent = custName.toUpperCase();
      if (previewNum) previewNum.textContent = '4532 8921 7842 1092';
      if (previewExp) previewExp.textContent = '11 / 29';
      if (previewType) previewType.textContent = 'VISA DEBIT';

      showToast('✓ Demo debit card details filled!', 'info');
    });
  }
}

function detectCardBrand(number) {
  const digits = (number || '').replace(/\D/g, '');
  if (digits.startsWith('4')) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^(60|65|81|82)/.test(digits)) return 'RuPay';
  if (/^(34|37)/.test(digits)) return 'Amex';
  return 'Debit Card';
}

function validateCheckoutForm() {
  let isValid = true;

  const fields = [
    { id: 'checkout-name', errorId: 'error-name', msg: 'Please enter your full name.' },
    { id: 'checkout-email', errorId: 'error-email', msg: 'Please enter a valid email address.', isEmail: true },
    { id: 'checkout-phone', errorId: 'error-phone', msg: 'Please enter a valid 10-digit mobile number.', isPhone: true },
    { id: 'checkout-address', errorId: 'error-address', msg: 'Please enter your complete street address.' },
    { id: 'checkout-city', errorId: 'error-city', msg: 'Please enter your city.' },
    { id: 'checkout-state', errorId: 'error-state', msg: 'Please choose your delivery state.' },
    { id: 'checkout-pincode', errorId: 'error-pincode', msg: 'Please enter a valid 6-digit PIN code.', isPin: true }
  ];

  fields.forEach(f => {
    const el = document.getElementById(f.id);
    const errEl = document.getElementById(f.errorId);
    if (!el || !errEl) return;

    errEl.textContent = '';
    el.classList.remove('input-invalid');

    const val = el.value.trim();

    if (!val) {
      errEl.textContent = f.msg;
      el.classList.add('input-invalid');
      isValid = false;
      return;
    }

    if (f.isEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        errEl.textContent = 'Please enter a valid email format.';
        el.classList.add('input-invalid');
        isValid = false;
      }
    }

    if (f.isPhone) {
      const digitsOnly = val.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        errEl.textContent = 'Phone number must be exactly 10 digits.';
        el.classList.add('input-invalid');
        isValid = false;
      }
    }

    if (f.isPin) {
      const pinDigits = val.replace(/\D/g, '');
      if (pinDigits.length !== 6) {
        errEl.textContent = 'PIN code must be exactly 6 digits.';
        el.classList.add('input-invalid');
        isValid = false;
      }
    }
  });

  // Validate Card Fields if Debit Card is chosen
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
  if (paymentMethod === 'card') {
    const cardHolder = document.getElementById('card-holder-name');
    const cardNum = document.getElementById('card-number-input');
    const cardExp = document.getElementById('card-expiry-input');
    const cardCvv = document.getElementById('card-cvv-input');

    const errName = document.getElementById('error-card-name');
    const errNum = document.getElementById('error-card-number');
    const errExp = document.getElementById('error-card-expiry');
    const errCvv = document.getElementById('error-card-cvv');

    if (errName) errName.textContent = '';
    if (errNum) errNum.textContent = '';
    if (errExp) errExp.textContent = '';
    if (errCvv) errCvv.textContent = '';

    // Cardholder Name
    if (!cardHolder || !cardHolder.value.trim()) {
      if (errName) errName.textContent = 'Please enter the name on your debit card.';
      if (cardHolder) cardHolder.classList.add('input-invalid');
      isValid = false;
    }

    // Card Number (16 digits)
    const rawNum = cardNum ? cardNum.value.replace(/\D/g, '') : '';
    if (rawNum.length !== 16) {
      if (errNum) errNum.textContent = 'Debit card number must be exactly 16 digits.';
      if (cardNum) cardNum.classList.add('input-invalid');
      isValid = false;
    }

    // Expiry Date (MM / YY)
    const rawExp = cardExp ? cardExp.value.replace(/\D/g, '') : '';
    if (rawExp.length < 4) {
      if (errExp) errExp.textContent = 'Enter a valid expiry date (MM / YY).';
      if (cardExp) cardExp.classList.add('input-invalid');
      isValid = false;
    } else {
      const month = parseInt(rawExp.substring(0, 2), 10);
      if (month < 1 || month > 12) {
        if (errExp) errExp.textContent = 'Invalid expiry month (01 to 12).';
        if (cardExp) cardExp.classList.add('input-invalid');
        isValid = false;
      }
    }

    // CVV (3 or 4 digits)
    const rawCvv = cardCvv ? cardCvv.value.replace(/\D/g, '') : '';
    if (rawCvv.length < 3 || rawCvv.length > 4) {
      if (errCvv) errCvv.textContent = 'Enter the 3-digit CVV from the back of your card.';
      if (cardCvv) cardCvv.classList.add('input-invalid');
      isValid = false;
    }
  }

  return isValid;
}

// =========================================================================
// RANDOM SCANNER SIMULATOR & UPI VERIFICATION
// =========================================================================

const UPI_SCAN_APPS = [
  { name: 'Google Pay', icon: '🔵', badgeClass: 'app-gpay', bank: 'HDFC Bank (•••• 4921)' },
  { name: 'PhonePe', icon: '🟣', badgeClass: 'app-phonepe', bank: 'State Bank of India (•••• 7812)' },
  { name: 'Paytm UPI', icon: '🔷', badgeClass: 'app-paytm', bank: 'Paytm Payments Bank (•••• 3309)' },
  { name: 'CRED UPI', icon: '⚫', badgeClass: 'app-cred', bank: 'Axis Bank (•••• 1045)' },
  { name: 'BHIM UPI', icon: '🟢', badgeClass: 'app-bhim', bank: 'ICICI Bank (•••• 6520)' }
];

function openRandomScannerModal(amount) {
  // Remove existing modal if present
  const existing = document.getElementById('random-scanner-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'random-scanner-modal';
  modal.className = 'scanner-modal-backdrop';

  modal.innerHTML = `
    <div class="scanner-modal-card">
      <div class="scanner-modal-header">
        <div class="scanner-modal-title">
          <span class="camera-indicator-dot"></span>
          <h3>📷 Mobile UPI QR Scanner</h3>
        </div>
        <button class="scanner-close-btn" id="scanner-modal-close" aria-label="Close Scanner">✕</button>
      </div>

      <div class="scanner-modal-body">
        <!-- Phone Viewfinder Container -->
        <div class="phone-viewfinder" id="phone-viewfinder">
          <!-- Laser Beam Animation -->
          <div class="laser-scan-line" id="scanner-laser"></div>

          <!-- Target Corner Reticles -->
          <div class="viewfinder-corners">
            <span class="corner-reticle top-left"></span>
            <span class="corner-reticle top-right"></span>
            <span class="corner-reticle bottom-left"></span>
            <span class="corner-reticle bottom-right"></span>
          </div>

          <!-- Centered QR Target Preview -->
          <div class="scanner-qr-target" id="scanner-qr-target">
            <img 
              src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=upi%3A%2F%2Fpay%3Fpa%3Dherbacart%40upi%26pn%3DHerbaCart%2520Store%26am%3D${amount}%26cu%3DINR" 
              alt="Target QR"
              onerror="this.onerror=null; this.src='data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\' fill=\'%232d5a3a\'><rect width=\'100\' height=\'100\' fill=\'%23ffffff\'/><rect x=\'10\' y=\'10\' width=\'25\' height=\'25\' fill=\'%232d5a3a\'/><rect x=\'65\' y=\'10\' width=\'25\' height=\'25\' fill=\'%232d5a3a\'/><rect x=\'10\' y=\'65\' width=\'25\' height=\'25\' fill=\'%232d5a3a\'/><rect x=\'40\' y=\'40\' width=\'20\' height=\'20\' fill=\'%232d5a3a\'/></svg>';" 
            />
          </div>

          <!-- Live Camera Viewfinder Overlay Text -->
          <div class="viewfinder-overlay-bar">
            <span class="viewfinder-status-pulse" id="scanner-status-text">
              📷 Aligning QR Code inside frame...
            </span>
          </div>
        </div>

        <!-- Scan Result Screen (Hidden initially) -->
        <div class="scanner-success-card hidden" id="scanner-success-card">
          <div class="success-checkmark-anim">
            <span class="check-circle">✓</span>
          </div>
          <h4 id="success-app-title">Payment Approved!</h4>
          <p class="success-amount-text">₹${amount}</p>
          <div class="success-meta-details">
            <div class="meta-row">
              <span>Merchant:</span>
              <strong>HerbaCart Botanicals</strong>
            </div>
            <div class="meta-row">
              <span>UPI App:</span>
              <strong id="success-app-name">Google Pay</strong>
            </div>
            <div class="meta-row">
              <span>Debited From:</span>
              <span id="success-bank-name">HDFC Bank (•••• 4921)</span>
            </div>
            <div class="meta-row">
              <span>Transaction Ref:</span>
              <code id="success-ref-id">UPI/829104829184</code>
            </div>
          </div>
        </div>

        <!-- Scanner Controls & Random Actions -->
        <div class="scanner-controls-footer" id="scanner-controls-footer">
          <p class="scanner-instruction-note">
            Click <strong>“Scan with Random App”</strong> to test a random UPI application (Google Pay, PhonePe, Paytm, CRED, BHIM) with a live scan sequence.
          </p>

          <button type="button" class="btn btn-secondary btn-block btn-lg" id="trigger-random-scan-btn">
            🎲 Scan with Random App
          </button>
        </div>

        <!-- Success Actions (Hidden initially) -->
        <div class="scanner-success-actions hidden" id="scanner-success-actions">
          <button type="button" class="btn btn-primary btn-block btn-lg" id="apply-verified-payment-btn">
            ✓ Use This Payment & Continue
          </button>
          <button type="button" class="btn btn-outline btn-block btn-sm" id="rescan-another-app-btn">
            🔄 Test Another Random App
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Close modal event
  const closeBtn = document.getElementById('scanner-modal-close');
  closeBtn.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Random scan trigger
  const triggerBtn = document.getElementById('trigger-random-scan-btn');
  const statusText = document.getElementById('scanner-status-text');
  const laser = document.getElementById('scanner-laser');
  const viewfinder = document.getElementById('phone-viewfinder');
  const successCard = document.getElementById('scanner-success-card');
  const controlsFooter = document.getElementById('scanner-controls-footer');
  const successActions = document.getElementById('scanner-success-actions');

  let currentScanResult = null;

  function runScanSequence() {
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = `⏳ Scanning in progress...`;
    laser.classList.add('laser-fast');

    // Pick random app from pool
    const randomApp = UPI_SCAN_APPS[Math.floor(Math.random() * UPI_SCAN_APPS.length)];
    const randomRefNum = Math.floor(100000000000 + Math.random() * 900000000000);
    const refNo = `UPI/${randomRefNum}/OK`;

    statusText.textContent = `🔍 Focusing camera... Detecting UPI payload...`;

    setTimeout(() => {
      statusText.textContent = `⚡ Recognized: upi://pay?pa=herbacart@upi&am=₹${amount}`;
    }, 600);

    setTimeout(() => {
      statusText.textContent = `📲 Connecting to ${randomApp.name}...`;
    }, 1200);

    setTimeout(() => {
      // Transition to success screen
      viewfinder.classList.add('hidden');
      successCard.classList.remove('hidden');
      controlsFooter.classList.add('hidden');
      successActions.classList.remove('hidden');

      document.getElementById('success-app-title').textContent = `Paid via ${randomApp.name}`;
      document.getElementById('success-app-name').textContent = `${randomApp.icon} ${randomApp.name}`;
      document.getElementById('success-bank-name').textContent = randomApp.bank;
      document.getElementById('success-ref-id').textContent = refNo;

      currentScanResult = {
        app: randomApp.name,
        bank: randomApp.bank,
        refNo: refNo,
        timestamp: new Date().toLocaleTimeString('en-IN')
      };
    }, 1800);
  }

  triggerBtn.addEventListener('click', runScanSequence);

  // Re-scan with another app button
  const rescanBtn = document.getElementById('rescan-another-app-btn');
  if (rescanBtn) {
    rescanBtn.addEventListener('click', () => {
      viewfinder.classList.remove('hidden');
      successCard.classList.add('hidden');
      controlsFooter.classList.remove('hidden');
      successActions.classList.add('hidden');
      laser.classList.remove('laser-fast');
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = `🎲 Scan with Random App`;
      statusText.textContent = `📷 Aligning QR Code inside frame...`;
      runScanSequence();
    });
  }

  // Apply verified payment button
  const applyBtn = document.getElementById('apply-verified-payment-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      if (currentScanResult) {
        AppState.upiVerified = true;
        AppState.upiTransaction = currentScanResult;

        // Update checkout page verified alert
        const verifiedAlert = document.getElementById('upi-verified-alert');
        const verifiedAppName = document.getElementById('verified-app-name');
        const verifiedRefNo = document.getElementById('verified-ref-no');

        if (verifiedAlert) verifiedAlert.classList.remove('hidden');
        if (verifiedAppName) verifiedAppName.textContent = currentScanResult.app;
        if (verifiedRefNo) verifiedRefNo.textContent = currentScanResult.refNo;

        showToast(`✓ Payment verified via ${currentScanResult.app}! (Ref: ${currentScanResult.refNo})`, 'success');
      }
      modal.remove();
    });
  }
}

function processOrderSubmission(orderTotals) {
  const name = document.getElementById('checkout-name').value.trim();
  const email = document.getElementById('checkout-email').value.trim();
  const phone = document.getElementById('checkout-phone').value.trim();
  const address = document.getElementById('checkout-address').value.trim();
  const city = document.getElementById('checkout-city').value.trim();
  const state = document.getElementById('checkout-state').value.trim();
  const pincode = document.getElementById('checkout-pincode').value.trim();
  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';

  // Capture Debit Card details if card was chosen
  let cardDetails = null;
  if (paymentMethod === 'card') {
    const rawCardNum = (document.getElementById('card-number-input')?.value || '').replace(/\D/g, '');
    const cardHolder = document.getElementById('card-holder-name')?.value.trim() || 'Cardholder';
    const last4 = rawCardNum.slice(-4) || '1092';
    const brand = detectCardBrand(rawCardNum);
    cardDetails = {
      name: cardHolder,
      last4: last4,
      brand: brand
    };
  }

  // Generate order details
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  const orderId = `HC-2026-${randomNum}`;
  const now = new Date();
  const orderDate = now.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Calculate estimated delivery (3-4 days ahead)
  const deliveryDateObj = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  const deliveryDateStr = deliveryDateObj.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const orderData = {
    orderId,
    orderDate,
    deliveryDate: deliveryDateStr,
    customer: { name, email, phone, address, city, state, pincode },
    paymentMethod: paymentMethod === 'cod' 
      ? 'Cash on Delivery' 
      : paymentMethod === 'upi' 
        ? (AppState.upiVerified ? `UPI QR (${AppState.upiTransaction.app})` : 'UPI / QR Code') 
        : (cardDetails ? `Debit Card (${cardDetails.brand} •••• ${cardDetails.last4})` : 'Debit Card'),
    upiTransaction: paymentMethod === 'upi' ? AppState.upiTransaction : null,
    cardDetails: cardDetails,
    items: orderTotals.items,
    subtotal: orderTotals.subtotal,
    shipping: orderTotals.shipping,
    discount: orderTotals.discount,
    grandTotal: orderTotals.grandTotal
  };

  // Clear cart in state and storage
  Cart.clear();

  // Reset UPI state for next order
  AppState.upiVerified = false;
  AppState.upiTransaction = null;

  // Render Confirmation view
  renderOrderConfirmation(orderData);
}

function renderOrderConfirmation(order) {
  const container = document.getElementById('checkout-page-container');
  if (!container) return;

  container.innerHTML = `
    <div class="confirmation-card-wrapper">
      <div class="confirmation-success-card">
        <div class="confirmation-check-anim">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2d5a3a" stroke-width="2.5">
            <circle cx="12" cy="12" r="10" fill="#eaf4ed"></circle>
            <path d="m9 12 2 2 4-4"></path>
          </svg>
        </div>

        <span class="confirmation-pill">Order Confirmed</span>
        <h1 class="confirmation-title">Thank You, ${order.customer.name}!</h1>
        <p class="confirmation-subtitle">
          Your order <strong>#${order.orderId}</strong> has been successfully placed.
        </p>

        <div class="confirmation-meta-box">
          <div class="meta-item">
            <small>Order Date</small>
            <strong>${order.orderDate}</strong>
          </div>
          <div class="meta-item">
            <small>Estimated Delivery</small>
            <strong class="text-primary">${order.deliveryDate}</strong>
          </div>
          <div class="meta-item">
            <small>Payment Mode</small>
            <strong>${order.paymentMethod}</strong>
          </div>
          <div class="meta-item">
            <small>Total Amount</small>
            <strong class="text-primary">₹${order.grandTotal}</strong>
          </div>
        </div>

        ${order.upiTransaction ? `
          <div class="confirmation-upi-receipt-card">
            <div class="upi-receipt-icon">✓</div>
            <div class="upi-receipt-info">
              <strong>Verified UPI Transaction</strong>
              <p>Paid seamlessly via <strong>${order.upiTransaction.app}</strong> (${order.upiTransaction.bank})</p>
              <small>UPI UTR / Reference ID: <code>${order.upiTransaction.refNo}</code> • ${order.upiTransaction.timestamp || 'Just now'}</small>
            </div>
          </div>
        ` : ''}

        ${order.cardDetails ? `
          <div class="confirmation-card-receipt-card">
            <div class="card-receipt-icon">💳</div>
            <div class="card-receipt-info">
              <strong>Debit Card Payment Authorized & Processed</strong>
              <p>Card: <strong>${order.cardDetails.brand} Debit Card</strong> ending in <strong>•••• ${order.cardDetails.last4}</strong></p>
              <small>Cardholder: <strong>${order.cardDetails.name}</strong> • 256-bit SSL Secure Simulated Authorization</small>
            </div>
          </div>
        ` : ''}

        <div class="confirmation-details-box">
          <h3>Shipping To:</h3>
          <p>
            <strong>${order.customer.name}</strong><br />
            ${order.customer.address}, ${order.customer.city}, ${order.customer.state} – ${order.customer.pincode}<br />
            Phone: +91 ${order.customer.phone} | Email: ${order.customer.email}
          </p>
        </div>

        <div class="confirmation-items-summary">
          <h3>Ordered Herbs (${order.items.length})</h3>
          <div class="ordered-items-grid">
            ${order.items.map(item => `
              <div class="ordered-item-cell">
                <img src="${item.image}" alt="${item.name}" onerror="this.onerror=null; this.src='assets/images/tulsi.jpg';" />
                <div class="ordered-cell-info">
                  <strong>${item.name}</strong>
                  <span>Qty: ${item.quantity} • ₹${item.itemTotal}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="student-project-disclaimer-card">
          <span class="disclaimer-badge">🎓 Academic Project Note</span>
          <p>
            HerbaCart is a prototype e-commerce application developed as a student project. 
            No real payment was charged, and this order serves as a demonstration of a modern, functional shopping cart system.
          </p>
        </div>

        <div class="confirmation-actions">
          <a href="#products" class="btn btn-primary btn-lg">
            Shop More Herbs
          </a>
          <a href="#home" class="btn btn-outline btn-lg">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  `;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('🎉 Order placed successfully!', 'success');
}

// =========================================================================
// AUTHENTICATION (LOGIN / REGISTER)
// =========================================================================

const USER_STORAGE_KEY = 'herbacart_user_session';

function getSavedUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveUserSession(user) {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    updateUserAuthUI();
  } catch (e) {
    console.error('Failed to save user session', e);
  }
}

function clearUserSession() {
  localStorage.removeItem(USER_STORAGE_KEY);
  updateUserAuthUI();
}

function updateUserAuthUI() {
  const user = getSavedUser();
  const authNavBtn = document.getElementById('nav-auth-btn');
  if (!authNavBtn) return;

  if (user) {
    authNavBtn.innerHTML = `
      <div class="user-profile-badge" title="Logged in as ${user.name}">
        <span class="user-avatar-initial">${user.name.charAt(0).toUpperCase()}</span>
        <span class="user-nav-name">${user.name.split(' ')[0]}</span>
      </div>
    `;
    authNavBtn.setAttribute('data-logged', 'true');
  } else {
    authNavBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
      <span>Login</span>
    `;
    authNavBtn.removeAttribute('data-logged');
  }
}

function renderAuthPage() {
  const container = document.getElementById('auth-page-container');
  if (!container) return;

  const currentUser = getSavedUser();

  if (currentUser) {
    container.innerHTML = `
      <div class="auth-card-wrapper">
        <div class="auth-profile-box">
          <div class="user-big-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
          <h2>Welcome, ${currentUser.name}!</h2>
          <p class="user-email-display">${currentUser.email}</p>
          <div class="user-status-pill">🌿 Active Herbal Wellness Member</div>

          <div class="profile-actions-grid">
            <a href="#products" class="btn btn-primary">Browse Herbs Collection</a>
            <a href="#cart" class="btn btn-outline">View Cart (${Cart.getTotalCount()})</a>
            <button class="btn btn-text text-danger" id="auth-logout-btn">Log Out</button>
          </div>
        </div>
      </div>
    `;

    const logoutBtn = document.getElementById('auth-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        clearUserSession();
        showToast('Logged out successfully.', 'info');
        renderAuthPage();
      });
    }
    return;
  }

  container.innerHTML = `
    <div class="auth-card-wrapper">
      <div class="auth-tabs-container">
        <div class="auth-tabs-nav">
          <button class="auth-tab-btn active" id="tab-btn-login">Sign In</button>
          <button class="auth-tab-btn" id="tab-btn-register">Create Account</button>
        </div>

        <!-- Login Form -->
        <div class="auth-tab-pane active" id="tab-pane-login">
          <div class="auth-header">
            <h2>Welcome Back to HerbaCart</h2>
            <p>Access your natural herbal remedies, order history & exclusive herbal guides.</p>
          </div>

          <form id="login-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="login-email">Email Address</label>
              <input type="email" id="login-email" required placeholder="name@example.com" value="ayurveda.student@herbacart.in" />
            </div>

            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" required placeholder="••••••••" value="herbal123" />
            </div>

            <div class="form-actions-row">
              <label class="remember-label">
                <input type="checkbox" id="login-remember" checked />
                <span>Remember me</span>
              </label>
              <a href="javascript:void(0)" class="forgot-link" onclick="alert('Password reset link simulated: Please use your password herbal123!')">Forgot Password?</a>
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg">
              Sign In to HerbaCart
            </button>

            <!-- Quick Demo Button -->
            <button type="button" class="btn btn-outline btn-block" id="quick-demo-login-btn">
              ⚡ Instant Guest Login (1-Click)
            </button>
          </form>
        </div>

        <!-- Register Form -->
        <div class="auth-tab-pane" id="tab-pane-register">
          <div class="auth-header">
            <h2>Join the HerbaCart Community</h2>
            <p>Embrace natural Ayurvedic vitality with ethically harvested remedies.</p>
          </div>

          <form id="register-form" class="auth-form" novalidate>
            <div class="form-group">
              <label for="register-name">Full Name <span class="required">*</span></label>
              <input type="text" id="register-name" required placeholder="e.g. Ananya Patel" />
            </div>

            <div class="form-group">
              <label for="register-email">Email Address <span class="required">*</span></label>
              <input type="email" id="register-email" required placeholder="ananya@example.com" />
            </div>

            <div class="form-group">
              <label for="register-password">Create Password <span class="required">*</span></label>
              <input type="password" id="register-password" required placeholder="Minimum 6 characters" />
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-lg">
              Create My Free Account
            </button>
          </form>
        </div>
      </div>
    </div>
  `;

  // Tab switching logic
  const tabLoginBtn = document.getElementById('tab-btn-login');
  const tabRegBtn = document.getElementById('tab-btn-register');
  const paneLogin = document.getElementById('tab-pane-login');
  const paneReg = document.getElementById('tab-pane-register');

  if (tabLoginBtn && tabRegBtn) {
    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.classList.add('active');
      tabRegBtn.classList.remove('active');
      paneLogin.classList.add('active');
      paneReg.classList.remove('active');
    });

    tabRegBtn.addEventListener('click', () => {
      tabRegBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      paneReg.classList.add('active');
      paneLogin.classList.remove('active');
    });
  }

  // Handle Login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const name = email.split('@')[0].replace('.', ' ').toUpperCase();
      saveUserSession({ name, email });
      showToast(`Welcome back, ${name}!`, 'success');
      navigateTo('products');
    });
  }

  // Quick Demo Login Button
  const demoBtn = document.getElementById('quick-demo-login-btn');
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      saveUserSession({ name: 'Ayush Sharma', email: 'ayush.sharma@herbacart.in' });
      showToast('Logged in as Ayush Sharma!', 'success');
      navigateTo('products');
    });
  }

  // Handle Register
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value.trim();
      const email = document.getElementById('register-email').value.trim();
      if (!name || !email) {
        alert('Please fill in your name and email.');
        return;
      }
      saveUserSession({ name, email });
      showToast(`Account created! Welcome to HerbaCart, ${name}!`, 'success');
      navigateTo('products');
    });
  }
}

// =========================================================================
// TOAST NOTIFICATION SYSTEM
// =========================================================================

function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  toast.innerHTML = `
    <span class="toast-text">${message}</span>
    <button class="toast-close" aria-label="Close">✕</button>
  `;

  container.appendChild(toast);

  // Trigger entrance
  requestAnimationFrame(() => toast.classList.add('show'));

  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  });

  // Auto dismiss after 3.2s
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 250);
    }
  }, 3200);
}

// =========================================================================
// MOBILE MENU & UI EVENT HANDLERS
// =========================================================================

function setupGlobalEventListeners() {
  // Mobile Hamburger Toggle
  const menuBtn = document.getElementById('mobile-menu-toggle');
  const navMenu = document.getElementById('main-nav-menu');
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      menuBtn.classList.toggle('active');
    });
  }

  // Listen to Cart Updates to re-render cart or checkout if currently on those views
  window.addEventListener('cartUpdated', () => {
    if (AppState.currentRoute === 'cart') {
      renderCartPage();
    }
  });

  // Product Search Input (Real-time debounce)
  const searchInput = document.getElementById('product-search-input');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        AppState.searchQuery = e.target.value;
        filterAndRenderProducts();
      }, 200);
    });
  }

  // Product Sort Dropdown
  const sortSelect = document.getElementById('product-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.sortBy = e.target.value;
      filterAndRenderProducts();
    });
  }

  // Product Price Filter Dropdown
  const priceSelect = document.getElementById('product-price-filter');
  if (priceSelect) {
    priceSelect.addEventListener('change', (e) => {
      AppState.selectedPriceRange = e.target.value;
      filterAndRenderProducts();
    });
  }

  // Category Filter Chips
  const categoryChips = document.querySelectorAll('.category-chip');
  categoryChips.forEach(chip => {
    chip.addEventListener('click', () => {
      categoryChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      AppState.selectedCategory = chip.getAttribute('data-category');
      filterAndRenderProducts();
    });
  });

  // Category cards on Home Page
  const homeCategoryCards = document.querySelectorAll('.home-cat-card');
  homeCategoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.getAttribute('data-category');
      AppState.selectedCategory = cat;
      navigateTo('products', { category: cat });
    });
  });

  // Reset Filters Button in Empty State
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      AppState.searchQuery = '';
      AppState.selectedCategory = 'all';
      AppState.selectedPriceRange = 'all';
      AppState.sortBy = 'recommended';
      renderProductsPage();
    });
  }
}

function closeMobileMenu() {
  const navMenu = document.getElementById('main-nav-menu');
  const menuBtn = document.getElementById('mobile-menu-toggle');
  if (navMenu) navMenu.classList.remove('open');
  if (menuBtn) menuBtn.classList.remove('active');
}

// Initial Bootstrapping
document.addEventListener('DOMContentLoaded', () => {
  setupGlobalEventListeners();
  updateUserAuthUI();
  initRouter();
});
