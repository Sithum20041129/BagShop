/**
 * BRIGHT BUY - E-Commerce Client Application
 * Inspired by DSI Foot Candy (dsifootcandy.lk)
 * Layered Architecture & Third-Party Auth (Clerk Ready)
 */

class BrightBuyApp {
  constructor() {
    window.app = this;
    this.apiBase = '/api/v1';
    this.products = [];
    this.categories = [];
    this.currentSlide = 0;
    this.slideInterval = null;

    // Authentication State
    this.currentUser = this.loadUser();
    this.authToken = this.loadToken();

    // Shopping State persisted in LocalStorage
    this.cart = this.loadCart();
    this.wishlist = this.loadWishlist();
    this.appliedCoupon = null;

    // Filters state
    this.filters = {
      category: 'All',
      search: '',
      sort: 'featured',
      minPrice: 0,
      maxPrice: 30000,
      isSale: false,
      isNew: false,
      isBestSeller: false
    };

    this.init();
  }

  async init() {
    this.bindEvents();
    this.renderAuthUI();
    this.initSlider();
    this.initCountdown();
    this.updateCartUI();
    this.updateWishlistUI();

    await Promise.all([
      this.fetchCategories(),
      this.fetchProducts()
    ]);
  }

  /* ========================================================================
     AUTHENTICATION & USER STATE
     ======================================================================== */
  loadUser() {
    try {
      const data = localStorage.getItem('brightbuy_user');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveUser(user) {
    this.currentUser = user;
    if (user) {
      localStorage.setItem('brightbuy_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('brightbuy_user');
    }
    this.renderAuthUI();
  }

  loadToken() {
    try {
      return localStorage.getItem('brightbuy_token') || null;
    } catch {
      return null;
    }
  }

  saveToken(token) {
    this.authToken = token;
    if (token) {
      localStorage.setItem('brightbuy_token', token);
    } else {
      localStorage.removeItem('brightbuy_token');
    }
  }

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    return headers;
  }

  renderAuthUI() {
    const container = document.getElementById('header-auth-container');
    const mobileAuth = document.getElementById('mobile-drawer-auth');
    const userGreet = document.getElementById('announcement-user-greet');

    if (this.currentUser) {
      const firstName = this.currentUser.name.split(' ')[0];
      const isAdmin = this.currentUser.role === 'admin';
      const avatarSrc = this.currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}&background=0F172A&color=D4AF37`;

      if (container) {
        container.innerHTML = `
          <div class="user-profile-menu-wrap">
            <button class="user-profile-pill" id="user-profile-btn" onclick="app.toggleUserMenu(event)">
              <img src="${avatarSrc}" alt="${this.currentUser.name}" class="user-nav-avatar">
              <span class="user-nav-name">${firstName} ${isAdmin ? '<span class="admin-badge-pill">ADMIN</span>' : ''}</span>
              <i class="fa-solid fa-chevron-down caret-icon"></i>
            </button>
            <div class="user-dropdown-menu hidden" id="user-dropdown-menu">
              <div class="user-dropdown-header">
                <strong>${this.currentUser.name} ${isAdmin ? '(Administrator)' : ''}</strong>
                <span>${this.currentUser.email}</span>
              </div>
              <ul class="user-dropdown-links">
                ${isAdmin ? `
                  <li>
                    <a href="#" class="admin-portal-link" onclick="app.openAdminDashboard(); return false;">
                      <i class="fa-solid fa-gauge-high"></i> Admin Portal
                    </a>
                  </li>
                ` : ''}
                <li><a href="#" onclick="app.openMyOrdersModal(); return false;"><i class="fa-solid fa-box"></i> My Orders</a></li>
                <li><a href="#" onclick="app.openWishlistModal(); return false;"><i class="fa-regular fa-heart"></i> Saved Wishlist</a></li>
                <li><a href="#" onclick="app.openTrackingModal(); return false;"><i class="fa-solid fa-truck-fast"></i> Order Tracking</a></li>
                <li class="divider"></li>
                <li><a href="#" class="logout-link" onclick="app.logout(); return false;"><i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out</a></li>
              </ul>
            </div>
          </div>
        `;
      }

      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <img src="${avatarSrc}" style="width:40px; height:40px; border-radius:50%; border:2px solid var(--accent);">
            <div style="flex:1;">
              <strong style="display:block; font-size:0.9rem; color:var(--primary);">${this.currentUser.name} ${isAdmin ? '<span class="admin-badge-pill">ADMIN</span>' : ''}</strong>
              <span style="font-size:0.75rem; color:var(--text-muted);">${this.currentUser.email}</span>
            </div>
            <button class="btn btn-outline btn-sm" onclick="app.logout()" style="color:var(--danger); border-color:var(--danger); font-size:0.75rem;">Logout</button>
          </div>
          <div style="margin-top:0.75rem; display:flex; gap:0.5rem; flex-wrap:wrap;">
            ${isAdmin ? `<button class="btn btn-accent btn-sm flex-1" onclick="app.closeMobileNav(); app.openAdminDashboard();"><i class="fa-solid fa-gauge-high"></i> Admin Portal</button>` : ''}
            <button class="btn btn-outline btn-sm flex-1" onclick="app.closeMobileNav(); app.openMyOrdersModal();">My Orders</button>
            <button class="btn btn-outline btn-sm flex-1" onclick="app.closeMobileNav(); app.openWishlistModal();">Wishlist</button>
          </div>
        `;
      }

      if (userGreet) {
        userGreet.classList.remove('hidden');
        userGreet.innerHTML = `<span><i class="fa-solid fa-user-check" style="color:var(--accent);"></i> Hi, <strong>${firstName}</strong> ${isAdmin ? '(Admin)' : ''}</span>`;
      }
    } else {
      // Guest state
      if (container) {
        container.innerHTML = `
          <div class="guest-auth-btns">
            <button type="button" class="btn-auth-nav btn-login" id="header-login-btn" data-auth-action="login">
              <i class="fa-regular fa-user"></i> <span>Login</span>
            </button>
            <button type="button" class="btn-auth-nav btn-signup" id="header-signup-btn" data-auth-action="register">
              <span>Sign Up</span>
            </button>
          </div>
        `;
      }

      if (mobileAuth) {
        mobileAuth.innerHTML = `
          <div style="display:flex; gap:0.5rem;">
            <button type="button" class="btn btn-outline btn-block" data-auth-action="login">
              <i class="fa-regular fa-user"></i> Login
            </button>
            <button type="button" class="btn btn-accent btn-block" data-auth-action="register">
              Sign Up
            </button>
          </div>
        `;
      }

      if (userGreet) {
        userGreet.classList.add('hidden');
      }
    }
  }

  toggleUserMenu(e) {
    if (e) e.stopPropagation();
    const menu = document.getElementById('user-dropdown-menu');
    if (menu) {
      menu.classList.toggle('hidden');
    }
  }

  openAuthModal(tab = 'login') {
    const modal = document.getElementById('auth-modal-backdrop');
    if (!modal) {
      console.warn('Auth modal backdrop not found in DOM');
      return;
    }
    this.switchAuthTab(tab);
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
  }

  closeAuthModal() {
    const modal = document.getElementById('auth-modal-backdrop');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }

  switchAuthTab(tab) {
    const loginTabBtn = document.getElementById('tab-login-btn');
    const registerTabBtn = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const title = document.getElementById('auth-modal-title');
    const subtitle = document.getElementById('auth-modal-subtitle');

    if (tab === 'login') {
      loginTabBtn?.classList.add('active');
      registerTabBtn?.classList.remove('active');
      loginForm?.classList.remove('hidden');
      registerForm?.classList.add('hidden');
      if (title) title.textContent = 'Welcome Back';
      if (subtitle) subtitle.textContent = 'Sign in to access your saved orders & checkout faster';
    } else {
      registerTabBtn?.classList.add('active');
      loginTabBtn?.classList.remove('active');
      registerForm?.classList.remove('hidden');
      loginForm?.classList.add('hidden');
      if (title) title.textContent = 'Join Bright Buy';
      if (subtitle) subtitle.textContent = 'Create your account to unlock 10% off your first bag';
    }
  }

  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const submitBtn = document.getElementById('login-submit-btn');

    if (!email || !password) {
      this.showToast('Please enter your email and password.', 'danger');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Signing in...`;
    }

    try {
      const res = await fetch(`${this.apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success && data.user) {
        this.saveToken(data.token);
        this.saveUser(data.user);
        this.closeAuthModal();
        this.showToast(`Welcome back, ${data.user.name}!`, 'success');
      } else {
        this.showToast(data.message || 'Login failed', 'danger');
      }
    } catch {
      this.showToast('Server communication error. Please try again.', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Sign In <i class="fa-solid fa-arrow-right"></i>`;
      }
    }
  }

  async handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const phone = document.getElementById('reg-phone')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const submitBtn = document.getElementById('register-submit-btn');

    if (!name || !email || !password) {
      this.showToast('Please fill all required registration fields.', 'danger');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...`;
    }

    try {
      const res = await fetch(`${this.apiBase}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      const data = await res.json();

      if (data.success && data.user) {
        this.saveToken(data.token);
        this.saveUser(data.user);
        this.closeAuthModal();
        this.showToast(data.message || 'Account created successfully!', 'success');
      } else {
        this.showToast(data.message || 'Registration failed', 'danger');
      }
    } catch {
      this.showToast('Server communication error. Please try again.', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Create Account & Get 10% Off`;
      }
    }
  }

  fillDemoAccount() {
    const emailInput = document.getElementById('login-email');
    const pwdInput = document.getElementById('login-password');
    if (emailInput && pwdInput) {
      emailInput.value = 'customer@brightbuy.lk';
      pwdInput.value = 'Password123!';
      this.showToast('Demo credentials pre-filled!', 'success');
    }
  }

  async handleThirdPartyAuth(provider = 'clerk') {
    // If Clerk SDK is embedded/configured in window.Clerk, invoke Clerk's native modal
    if (window.Clerk && window.Clerk.isReady && window.Clerk.isReady()) {
      window.Clerk.openSignIn();
      return;
    }

    // Seamless third-party authentication layer flow
    this.showToast(`Connecting with ${provider.toUpperCase()} Auth Service...`, 'default');

    try {
      const mockClerkPayload = {
        clerkId: 'user_clerk_demo_' + Math.floor(Math.random() * 10000),
        email: 'member@clerk.brightbuy.lk',
        name: 'Clerk Verified Member',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
      };

      const res = await fetch(`${this.apiBase}/auth/clerk-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockClerkPayload)
      });
      const data = await res.json();

      if (data.success && data.user) {
        this.saveToken(data.token);
        this.saveUser(data.user);
        this.closeAuthModal();
        this.showToast(`Authenticated via Clerk as ${data.user.name}!`, 'success');
      } else {
        this.showToast('Clerk authentication sync failed.', 'danger');
      }
    } catch {
      this.showToast('Could not reach third-party auth service.', 'danger');
    }
  }

  logout() {
    this.saveUser(null);
    this.saveToken(null);
    this.showToast('You have been signed out successfully.', 'default');
  }

  togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.type = field.type === 'password' ? 'text' : 'password';
  }

  async openMyOrdersModal() {
    const modal = document.getElementById('my-orders-modal-backdrop');
    const list = document.getElementById('my-orders-list');
    if (!modal || !list) return;

    if (!this.currentUser) {
      this.openAuthModal('login');
      return;
    }

    list.innerHTML = `<div style="text-align:center; padding:2rem;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching your orders...</div>`;
    modal.classList.remove('hidden');

    try {
      const res = await fetch(`${this.apiBase}/orders/my-orders`, {
        headers: this.getAuthHeaders()
      });
      const data = await res.json();

      if (data.success && data.orders && data.orders.length > 0) {
        list.innerHTML = data.orders.map(o => `
          <div class="my-order-card">
            <div class="my-order-header">
              <div>
                <strong style="color:var(--primary); font-size:1rem;">Order ${o.orderId}</strong>
                <span style="font-size:0.775rem; color:var(--text-muted); display:block;">Placed on ${new Date(o.createdAt).toLocaleDateString('en-US', { dateStyle: 'medium' })}</span>
              </div>
              <span class="order-status-pill">${o.orderStatus}</span>
            </div>

            <div class="my-order-items">
              ${o.items.map(item => `
                <div class="my-order-item-row">
                  <span>${item.quantity}x ${item.name} (${item.selectedColor})</span>
                  <strong>Rs. ${(item.price * item.quantity).toLocaleString()}</strong>
                </div>
              `).join('')}
            </div>

            <div class="my-order-footer">
              <span style="font-weight:700; color:var(--primary);">Total: Rs. ${o.total.toLocaleString()} (${o.paymentMethod})</span>
              <button class="btn btn-outline btn-sm" onclick="app.closeMyOrdersModal(); app.openTrackingModal('${o.orderId}');">
                <i class="fa-solid fa-location-dot"></i> Track Live
              </button>
            </div>
          </div>
        `).join('');
      } else {
        list.innerHTML = `
          <div style="text-align:center; padding:3rem 1rem;">
            <i class="fa-solid fa-box-open" style="font-size:3rem; color:#cbd5e1; margin-bottom:1rem;"></i>
            <h4>No orders placed yet</h4>
            <p style="color:var(--text-muted); margin-bottom:1.5rem;">Explore our curated bags and place your first order!</p>
            <button class="btn btn-primary" onclick="app.closeMyOrdersModal(); window.location.hash='#catalog';">Start Shopping</button>
          </div>
        `;
      }
    } catch {
      list.innerHTML = `<div style="text-align:center; color:var(--danger); padding:2rem;">Could not load orders. Please try again.</div>`;
    }
  }

  closeMyOrdersModal() {
    const modal = document.getElementById('my-orders-modal-backdrop');
    if (modal) modal.classList.add('hidden');
  }

  /* ========================================================================
     LOCAL STORAGE HELPERS
     ======================================================================== */
  loadCart() {
    try {
      const data = localStorage.getItem('brightbuy_cart');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveCart() {
    localStorage.setItem('brightbuy_cart', JSON.stringify(this.cart));
    this.updateCartUI();
  }

  loadWishlist() {
    try {
      const data = localStorage.getItem('brightbuy_wishlist');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveWishlist() {
    localStorage.setItem('brightbuy_wishlist', JSON.stringify(this.wishlist));
    this.updateWishlistUI();
  }

  /* ========================================================================
     API FETCH CALLS
     ======================================================================== */
  async fetchProducts() {
    try {
      const params = new URLSearchParams();
      if (this.filters.category && this.filters.category !== 'All') {
        params.append('category', this.filters.category);
      }
      if (this.filters.search) {
        params.append('search', this.filters.search);
      }
      if (this.filters.sort) {
        params.append('sort', this.filters.sort);
      }
      if (this.filters.isSale) {
        params.append('tag', 'sale');
      }
      if (this.filters.isNew) {
        params.append('isNew', 'true');
      }
      if (this.filters.isBestSeller) {
        params.append('isBestSeller', 'true');
      }
      if (this.filters.maxPrice < 30000) {
        params.append('maxPrice', this.filters.maxPrice);
      }

      const res = await fetch(`${this.apiBase}/products?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        this.products = data.products;
        this.renderProducts();
        this.renderAppliedFilterChips();
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      this.showToast('Could not load products. Please check connection.', 'danger');
    }
  }

  async fetchCategories() {
    try {
      const res = await fetch(`${this.apiBase}/categories`);
      const data = await res.json();
      if (data.success) {
        this.categories = data.categories;
        this.renderCategoryCards();
        this.renderFilterDrawerCategories();
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }

  /* ========================================================================
     RENDERING
     ======================================================================== */
  renderCategoryCards() {
    const grid = document.getElementById('category-cards-grid');
    if (!grid) return;

    grid.innerHTML = this.categories.map(cat => `
      <div class="category-card" onclick="app.filterByCategory('${cat.name}')">
        <div class="category-img-wrap">
          <img src="${cat.image}" alt="${cat.name}" loading="lazy">
        </div>
        <span class="category-card-name">${cat.name}</span>
        <span class="category-card-count">${cat.count} Items</span>
      </div>
    `).join('');
  }

  renderFilterDrawerCategories() {
    const container = document.getElementById('filter-categories-list');
    if (!container) return;

    let html = `
      <label class="filter-radio-label">
        <input type="radio" name="drawer-cat" value="All" ${this.filters.category === 'All' ? 'checked' : ''}>
        <span>All Categories</span>
      </label>
    `;

    this.categories.forEach(cat => {
      html += `
        <label class="filter-radio-label">
          <input type="radio" name="drawer-cat" value="${cat.name}" ${this.filters.category === cat.name ? 'checked' : ''}>
          <span>${cat.name} (${cat.count})</span>
        </label>
      `;
    });

    container.innerHTML = html;
  }

  renderProducts() {
    const grid = document.getElementById('products-grid');
    const emptyState = document.getElementById('empty-state');
    const countBadge = document.getElementById('products-count-badge');
    const heading = document.getElementById('catalog-heading');

    if (!grid) return;

    if (countBadge) {
      countBadge.textContent = `${this.products.length} Items`;
    }

    if (heading) {
      heading.textContent = this.filters.category === 'All' ? 'All Bags' : this.filters.category;
    }

    if (this.products.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    grid.innerHTML = this.products.map(p => {
      const isWishlisted = this.wishlist.includes(p.id);
      const discount = p.discountPercent || Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);

      const badgesHtml = `
        <div class="badge-stack">
          ${discount > 0 ? `<span class="card-badge badge-sale">-${discount}% OFF</span>` : ''}
          ${p.isNew ? `<span class="card-badge badge-new">NEW</span>` : ''}
          ${p.isBestSeller ? `<span class="card-badge badge-bestseller">BESTSELLER</span>` : ''}
        </div>
      `;

      const swatchesHtml = p.colors && p.colors.length > 0 ? `
        <div class="product-swatches" title="${p.colors.map(c => c.name).join(', ')}">
          ${p.colors.map((c, i) => `
            <span class="swatch-dot ${i === 0 ? 'active' : ''}" style="background-color: ${c.hex};" title="${c.name}"></span>
          `).join('')}
        </div>
      ` : '';

      return `
        <article class="product-card" data-id="${p.id}">
          <div class="product-media">
            ${badgesHtml}
            <div class="card-actions-float">
              <button class="btn-icon-float ${isWishlisted ? 'active' : ''}" 
                      title="Save to Wishlist" 
                      onclick="app.toggleWishlist('${p.id}', event)">
                <i class="${isWishlisted ? 'fa-solid text-danger' : 'fa-regular'} fa-heart"></i>
              </button>
              <button class="btn-icon-float" 
                      title="Quick View" 
                      onclick="app.openQuickView('${p.id}', event)">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
            <img src="${p.images[0]}" alt="${p.name}" class="product-img" loading="lazy" id="prod-img-${p.id}">
          </div>

          <div class="product-info">
            <div class="product-category-meta">
              <span>${p.category}</span>
              <span><i class="fa-solid fa-circle-check text-success"></i> In Stock</span>
            </div>

            <h3 class="product-title" onclick="app.openQuickView('${p.id}')">${p.name}</h3>

            <div class="product-rating">
              <span class="rating-stars">
                ${this.renderStarRating(p.rating)}
              </span>
              <span class="rating-count">(${p.reviewCount || 12})</span>
            </div>

            ${swatchesHtml}

            <div class="product-pricing">
              <span class="current-price">Rs. ${p.price.toLocaleString()}</span>
              ${p.originalPrice ? `<span class="original-price">Rs. ${p.originalPrice.toLocaleString()}</span>` : ''}
            </div>

            <button class="product-add-btn" onclick="app.addToCart('${p.id}')">
              <i class="fa-solid fa-cart-plus"></i> Add to Cart
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  renderStarRating(rating) {
    let stars = '';
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;

    for (let i = 0; i < full; i++) {
      stars += '<i class="fa-solid fa-star"></i>';
    }
    if (half) {
      stars += '<i class="fa-solid fa-star-half-stroke"></i>';
    }
    const empty = 5 - full - (half ? 1 : 0);
    for (let i = 0; i < empty; i++) {
      stars += '<i class="fa-regular fa-star"></i>';
    }
    return stars;
  }

  renderAppliedFilterChips() {
    const bar = document.getElementById('applied-filters-bar');
    const container = document.getElementById('chips-container');
    if (!bar || !container) return;

    const chips = [];

    if (this.filters.category && this.filters.category !== 'All') {
      chips.push({ label: `Category: ${this.filters.category}`, key: 'category' });
    }
    if (this.filters.search) {
      chips.push({ label: `Search: "${this.filters.search}"`, key: 'search' });
    }
    if (this.filters.isSale) {
      chips.push({ label: 'On Sale', key: 'isSale' });
    }
    if (this.filters.isNew) {
      chips.push({ label: 'New Arrivals', key: 'isNew' });
    }
    if (this.filters.isBestSeller) {
      chips.push({ label: 'Best Sellers', key: 'isBestSeller' });
    }
    if (this.filters.maxPrice < 30000) {
      chips.push({ label: `Max Rs. ${this.filters.maxPrice.toLocaleString()}`, key: 'maxPrice' });
    }

    if (chips.length === 0) {
      bar.classList.add('hidden');
      return;
    }

    bar.classList.remove('hidden');
    container.innerHTML = chips.map(c => `
      <span class="filter-chip">
        ${c.label}
        <button onclick="app.removeFilterChip('${c.key}')" title="Remove filter"><i class="fa-solid fa-xmark"></i></button>
      </span>
    `).join('');
  }

  removeFilterChip(key) {
    if (key === 'category') this.filters.category = 'All';
    if (key === 'search') {
      this.filters.search = '';
      const input = document.getElementById('global-search-input');
      if (input) input.value = '';
    }
    if (key === 'isSale') this.filters.isSale = false;
    if (key === 'isNew') this.filters.isNew = false;
    if (key === 'isBestSeller') this.filters.isBestSeller = false;
    if (key === 'maxPrice') {
      this.filters.maxPrice = 30000;
      const slider = document.getElementById('price-range-slider');
      if (slider) slider.value = 30000;
    }
    this.updateActiveNavs();
    this.fetchProducts();
  }

  resetAllFilters() {
    this.filters = {
      category: 'All',
      search: '',
      sort: 'featured',
      minPrice: 0,
      maxPrice: 30000,
      isSale: false,
      isNew: false,
      isBestSeller: false
    };

    const searchInput = document.getElementById('global-search-input');
    if (searchInput) searchInput.value = '';

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'featured';

    const priceSlider = document.getElementById('price-range-slider');
    if (priceSlider) priceSlider.value = 30000;

    this.updateActiveNavs();
    this.fetchProducts();
  }

  /* ========================================================================
     CART MANAGEMENT
     ======================================================================== */
  addToCart(productId, selectedColor = null, quantity = 1) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const color = selectedColor || (product.colors && product.colors[0]?.name) || 'Standard';
    const existingIndex = this.cart.findIndex(i => i.id === productId && i.selectedColor === color);

    if (existingIndex > -1) {
      this.cart[existingIndex].quantity += quantity;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images[0],
        selectedColor: color,
        quantity: quantity
      });
    }

    this.saveCart();
    this.showToast(`Added "${product.name}" to cart!`, 'success');
    this.openCart();
  }

  updateItemQuantity(index, delta) {
    if (!this.cart[index]) return;
    this.cart[index].quantity += delta;
    if (this.cart[index].quantity <= 0) {
      this.cart.splice(index, 1);
    }
    this.saveCart();
  }

  removeFromCart(index) {
    if (!this.cart[index]) return;
    const name = this.cart[index].name;
    this.cart.splice(index, 1);
    this.saveCart();
    this.showToast(`Removed "${name}" from cart`, 'danger');
  }

  updateCartUI() {
    const totalCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let discount = 0;
    let freeShippingCoupon = false;

    if (this.appliedCoupon) {
      if (this.appliedCoupon.discountPercent) {
        discount = Math.round((subtotal * this.appliedCoupon.discountPercent) / 100);
      }
      if (this.appliedCoupon.freeShipping) {
        freeShippingCoupon = true;
      }
    }

    const shippingFee = (subtotal >= 15000 || freeShippingCoupon || totalCount === 0) ? 0 : 650;
    const grandTotal = Math.max(0, subtotal - discount + shippingFee);

    const headerCartCount = document.getElementById('cart-count');
    const headerCartTotal = document.getElementById('header-cart-total');
    if (headerCartCount) headerCartCount.textContent = totalCount;
    if (headerCartTotal) headerCartTotal.textContent = `Rs. ${grandTotal.toLocaleString()}`;

    const drawerCount = document.getElementById('cart-items-count');
    if (drawerCount) drawerCount.textContent = totalCount;

    const progressFill = document.getElementById('shipping-progress-fill');
    const notice = document.getElementById('free-shipping-notice');
    const threshold = 15000;

    if (progressFill && notice) {
      if (subtotal >= threshold) {
        progressFill.style.width = '100%';
        notice.innerHTML = `<span class="text-success"><i class="fa-solid fa-circle-check"></i> <strong>Congratulations!</strong> You unlocked <strong>FREE Islandwide Delivery!</strong></span>`;
      } else {
        const remaining = threshold - subtotal;
        const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
        progressFill.style.width = `${pct}%`;
        notice.innerHTML = `Add <strong>Rs. ${remaining.toLocaleString()}</strong> more for <strong>FREE ISLANDWIDE DELIVERY!</strong>`;
      }
    }

    const container = document.getElementById('cart-items-container');
    if (container) {
      if (this.cart.length === 0) {
        container.innerHTML = `
          <div class="cart-empty-message">
            <i class="fa-solid fa-bag-shopping"></i>
            <h4>Your shopping cart is empty</h4>
            <p>Explore our handcrafted bags and accessories to fill it up!</p>
            <button class="btn btn-primary btn-sm mt-3" onclick="app.closeCart(); window.location.hash='#catalog';">Browse Bags</button>
          </div>
        `;
      } else {
        container.innerHTML = this.cart.map((item, idx) => `
          <div class="cart-item-card">
            <img src="${item.image}" alt="${item.name}" class="cart-item-thumb">
            <div class="cart-item-details">
              <h5 class="cart-item-name">${item.name}</h5>
              <div class="cart-item-meta">
                <span>Color: <strong>${item.selectedColor}</strong></span>
              </div>
              <div class="cart-item-footer">
                <div class="qty-control">
                  <button class="qty-btn" onclick="app.updateItemQuantity(${idx}, -1)">-</button>
                  <span class="qty-display">${item.quantity}</span>
                  <button class="qty-btn" onclick="app.updateItemQuantity(${idx}, 1)">+</button>
                </div>
                <span class="cart-item-price-calc">Rs. ${(item.price * item.quantity).toLocaleString()}</span>
                <button class="cart-item-remove" onclick="app.removeFromCart(${idx})" title="Remove item">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }

    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('cart-shipping-fee');
    const totalEl = document.getElementById('cart-total-amt');
    const discountRow = document.getElementById('cart-discount-row');
    const discountAmtEl = document.getElementById('cart-discount-amt');
    const discountLabel = document.getElementById('applied-discount-label');

    if (subtotalEl) subtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
    if (shippingEl) shippingEl.textContent = shippingFee === 0 ? 'FREE' : `Rs. ${shippingFee.toLocaleString()}`;
    if (totalEl) totalEl.textContent = `Rs. ${grandTotal.toLocaleString()}`;

    if (discountRow) {
      if (discount > 0) {
        discountRow.classList.remove('hidden');
        if (discountAmtEl) discountAmtEl.textContent = `- Rs. ${discount.toLocaleString()}`;
        if (discountLabel && this.appliedCoupon) {
          discountLabel.textContent = `${this.appliedCoupon.discountPercent}%`;
        }
      } else {
        discountRow.classList.add('hidden');
      }
    }
  }

  async applyCoupon() {
    const input = document.getElementById('cart-coupon-input');
    const feedback = document.getElementById('coupon-feedback');
    if (!input || !feedback) return;

    const code = input.value.trim().toUpperCase();
    if (!code) {
      feedback.textContent = 'Please enter a coupon code';
      feedback.className = 'coupon-feedback error';
      feedback.classList.remove('hidden');
      return;
    }

    try {
      const res = await fetch(`${this.apiBase}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      const data = await res.json();

      if (data.success) {
        this.appliedCoupon = data.coupon;
        this.appliedCoupon.code = data.code;
        feedback.textContent = `Voucher ${data.code} applied! ${data.coupon.description}`;
        feedback.className = 'coupon-feedback success';
        feedback.classList.remove('hidden');
        this.updateCartUI();
        this.showToast(`Coupon ${data.code} successfully applied!`, 'success');
      } else {
        feedback.textContent = data.message || 'Invalid coupon code';
        feedback.className = 'coupon-feedback error';
        feedback.classList.remove('hidden');
      }
    } catch {
      feedback.textContent = 'Failed to validate coupon';
      feedback.className = 'coupon-feedback error';
      feedback.classList.remove('hidden');
    }
  }

  /* ========================================================================
     WISHLIST MANAGEMENT
     ======================================================================== */
  toggleWishlist(productId, event) {
    if (event) event.stopPropagation();

    const idx = this.wishlist.indexOf(productId);
    const product = this.products.find(p => p.id === productId);

    if (idx > -1) {
      this.wishlist.splice(idx, 1);
      this.showToast(`Removed from wishlist`, 'danger');
    } else {
      this.wishlist.push(productId);
      this.showToast(`Saved "${product ? product.name : 'Bag'}" to wishlist!`, 'success');
    }

    this.saveWishlist();
    this.renderProducts();
  }

  updateWishlistUI() {
    const countEl = document.getElementById('wishlist-count');
    const modalCountEl = document.getElementById('wishlist-modal-count');
    if (countEl) countEl.textContent = this.wishlist.length;
    if (modalCountEl) modalCountEl.textContent = this.wishlist.length;
  }

  openWishlistModal() {
    const modal = document.getElementById('wishlist-modal-backdrop');
    const grid = document.getElementById('wishlist-items-grid');
    if (!modal || !grid) return;

    if (this.wishlist.length === 0) {
      grid.innerHTML = `
        <div class="cart-empty-message">
          <i class="fa-regular fa-heart"></i>
          <h4>Your wishlist is empty</h4>
          <p>Click the heart icon on any bag to save it here for later.</p>
        </div>
      `;
    } else {
      const items = this.products.filter(p => this.wishlist.includes(p.id));
      grid.innerHTML = items.map(p => `
        <div class="wishlist-item-row">
          <div class="wishlist-item-left">
            <img src="${p.images[0]}" alt="${p.name}" class="wishlist-item-thumb">
            <div>
              <h5 class="wishlist-item-name">${p.name}</h5>
              <span class="wishlist-item-price">Rs. ${p.price.toLocaleString()}</span>
            </div>
          </div>
          <div class="wishlist-item-actions">
            <button class="btn btn-primary btn-sm" onclick="app.addToCart('${p.id}'); app.toggleWishlist('${p.id}');">
              <i class="fa-solid fa-cart-plus"></i> Move to Cart
            </button>
            <button class="btn btn-outline btn-sm" onclick="app.toggleWishlist('${p.id}'); app.openWishlistModal();" title="Remove">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `).join('');
    }

    modal.classList.remove('hidden');
  }

  /* ========================================================================
     DRAWER & MODAL CONTROLS
     ======================================================================== */
  openCart() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('active');
      backdrop.classList.add('active');
    }
  }

  closeCart() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('active');
      backdrop.classList.remove('active');
    }
  }

  openFilterDrawer() {
    const drawer = document.getElementById('filter-drawer');
    const backdrop = document.getElementById('filter-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('active');
      backdrop.classList.add('active');
    }
  }

  closeFilterDrawer() {
    const drawer = document.getElementById('filter-drawer');
    const backdrop = document.getElementById('filter-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('active');
      backdrop.classList.remove('active');
    }
  }

  openMobileNav() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('active');
      backdrop.classList.add('active');
    }
  }

  closeMobileNav() {
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('active');
      backdrop.classList.remove('active');
    }
  }

  /* ========================================================================
     QUICK VIEW MODAL
     ======================================================================== */
  async openQuickView(productId, event) {
    if (event) event.stopPropagation();

    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const modal = document.getElementById('quickview-modal-backdrop');
    const body = document.getElementById('quickview-body');
    if (!modal || !body) return;

    body.innerHTML = `
      <div class="quickview-gallery">
        <img src="${product.images[0]}" alt="${product.name}" class="quickview-main-img" id="quickview-active-img">
        <div class="quickview-thumbs">
          ${product.images.map((img, i) => `
            <img src="${img}" alt="${product.name}" class="quickview-thumb-img ${i === 0 ? 'active' : ''}" 
                 onclick="document.getElementById('quickview-active-img').src='${img}'; document.querySelectorAll('.quickview-thumb-img').forEach(el=>el.classList.remove('active')); this.classList.add('active');">
          `).join('')}
        </div>
      </div>

      <div class="quickview-details">
        <span class="quickview-brand">${product.brand || 'Bright Buy Exclusive'}</span>
        <h2 class="quickview-title">${product.name}</h2>

        <div class="product-rating mb-2">
          <span class="rating-stars">${this.renderStarRating(product.rating)}</span>
          <span class="rating-count">(${product.reviewCount || 15} Reviews) • SKU: ${product.id.toUpperCase()}</span>
        </div>

        <div class="quickview-pricing">
          <span class="current-price" style="font-size: 1.5rem;">Rs. ${product.price.toLocaleString()}</span>
          ${product.originalPrice ? `<span class="original-price" style="font-size: 1.1rem;">Rs. ${product.originalPrice.toLocaleString()}</span>` : ''}
          ${product.discountPercent ? `<span class="card-badge badge-sale" style="font-size: 0.8rem;">Save ${product.discountPercent}%</span>` : ''}
        </div>

        <p class="quickview-desc">${product.description}</p>

        <ul class="quickview-features">
          ${product.features.map(f => `<li><i class="fa-solid fa-check"></i> ${f}</li>`).join('')}
        </ul>

        ${product.colors && product.colors.length > 0 ? `
          <div class="quickview-color-selection">
            <div class="quickview-color-label">Selected Color: <strong id="qv-selected-color">${product.colors[0].name}</strong></div>
            <div class="quickview-color-swatches">
              ${product.colors.map((c, i) => `
                <button type="button" class="color-option-btn ${i === 0 ? 'active' : ''}" 
                        onclick="document.querySelectorAll('.color-option-btn').forEach(b=>b.classList.remove('active')); this.classList.add('active'); document.getElementById('qv-selected-color').innerText='${c.name}';">
                  <span class="color-dot-small" style="background-color: ${c.hex};"></span>
                  ${c.name}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="quickview-action-row">
          <button class="btn btn-primary btn-lg flex-1" onclick="
            const chosenColor = document.getElementById('qv-selected-color') ? document.getElementById('qv-selected-color').innerText : null;
            app.addToCart('${product.id}', chosenColor);
            document.getElementById('quickview-modal-backdrop').classList.add('hidden');
          ">
            <i class="fa-solid fa-cart-plus"></i> Add to Cart • Rs. ${product.price.toLocaleString()}
          </button>
          <button class="btn btn-outline btn-lg" onclick="app.toggleWishlist('${product.id}');" title="Save to Wishlist">
            <i class="fa-regular fa-heart"></i>
          </button>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  /* ========================================================================
     CHECKOUT FLOW
     ======================================================================== */
  openCheckoutModal() {
    if (this.cart.length === 0) {
      this.showToast('Your cart is empty! Add items first.', 'danger');
      return;
    }

    this.closeCart();
    const modal = document.getElementById('checkout-modal-backdrop');
    const successView = document.getElementById('order-success-view');
    const form = document.getElementById('checkout-form');
    if (!modal) return;

    if (successView) successView.classList.add('hidden');
    if (form) form.classList.remove('hidden');

    // Pre-fill user data if authenticated
    if (this.currentUser) {
      const nameInput = document.getElementById('cust-name');
      const emailInput = document.getElementById('cust-email');
      const phoneInput = document.getElementById('cust-phone');
      if (nameInput && !nameInput.value) nameInput.value = this.currentUser.name || '';
      if (emailInput && !emailInput.value) emailInput.value = this.currentUser.email || '';
      if (phoneInput && !phoneInput.value) phoneInput.value = this.currentUser.phone || '';
    }

    this.updateCheckoutSummaryPreview();
    modal.classList.remove('hidden');
  }

  closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal-backdrop');
    if (modal) modal.classList.add('hidden');
  }

  updateCheckoutSummaryPreview() {
    const previewContainer = document.getElementById('checkout-items-preview');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const discountRow = document.getElementById('checkout-discount-row');
    const discountValEl = document.getElementById('checkout-discount-val');
    const deliveryFeeEl = document.getElementById('checkout-delivery-fee');
    const grandTotalEl = document.getElementById('checkout-grand-total');

    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    let freeShippingCoupon = false;

    if (this.appliedCoupon) {
      if (this.appliedCoupon.discountPercent) {
        discount = Math.round((subtotal * this.appliedCoupon.discountPercent) / 100);
      }
      if (this.appliedCoupon.freeShipping) {
        freeShippingCoupon = true;
      }
    }

    const shippingFee = (subtotal >= 15000 || freeShippingCoupon) ? 0 : 650;
    const total = Math.max(0, subtotal - discount + shippingFee);

    if (previewContainer) {
      previewContainer.innerHTML = this.cart.map(item => `
        <div class="checkout-preview-item">
          <img src="${item.image}" alt="${item.name}" class="checkout-preview-img">
          <div class="checkout-preview-info">
            <strong>${item.name}</strong>
            <span>Qty: ${item.quantity} • Color: ${item.selectedColor}</span>
          </div>
          <span class="checkout-preview-price">Rs. ${(item.price * item.quantity).toLocaleString()}</span>
        </div>
      `).join('');
    }

    if (subtotalEl) subtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
    if (deliveryFeeEl) deliveryFeeEl.textContent = shippingFee === 0 ? 'FREE' : `Rs. ${shippingFee.toLocaleString()}`;
    if (grandTotalEl) grandTotalEl.textContent = `Rs. ${total.toLocaleString()}`;

    if (discountRow) {
      if (discount > 0) {
        discountRow.classList.remove('hidden');
        if (discountValEl) discountValEl.textContent = `- Rs. ${discount.toLocaleString()}`;
      } else {
        discountRow.classList.add('hidden');
      }
    }
  }

  async handleOrderSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('cust-name').value.trim();
    const phone = document.getElementById('cust-phone').value.trim();
    const email = document.getElementById('cust-email').value.trim();
    const address = document.getElementById('cust-address').value.trim();
    const city = document.getElementById('cust-city').value.trim();
    const district = document.getElementById('cust-district').value;
    const notes = document.getElementById('cust-notes').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'Cash on Delivery (COD)';

    if (!name || !phone || !address || !city) {
      this.showToast('Please fill in all required shipping fields', 'danger');
      return;
    }

    const orderPayload = {
      customer: {
        name,
        phone,
        email: email || (this.currentUser ? this.currentUser.email : ''),
        address,
        city,
        district,
        userId: this.currentUser ? this.currentUser.id : null
      },
      deliveryNotes: notes,
      paymentMethod,
      couponCode: this.appliedCoupon ? this.appliedCoupon.code : null,
      items: this.cart
    };

    const submitBtn = document.getElementById('submit-order-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Order...`;
    }

    try {
      const res = await fetch(`${this.apiBase}/orders`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(orderPayload)
      });
      const data = await res.json();

      if (data.success && data.order) {
        const form = document.getElementById('checkout-form');
        const successView = document.getElementById('order-success-view');
        const orderIdDisplay = document.getElementById('success-order-id');
        const summaryContent = document.getElementById('success-order-summary-content');

        if (form) form.classList.add('hidden');
        if (successView) successView.classList.remove('hidden');
        if (orderIdDisplay) orderIdDisplay.textContent = data.order.orderId;

        if (summaryContent) {
          summaryContent.innerHTML = `
            <div style="background:#f8fafc; border-radius:8px; padding:1.25rem; margin-bottom:1.5rem; text-align:left; font-size:0.9rem;">
              <p><strong>Recipient:</strong> ${data.order.customer.name} (${data.order.customer.phone})</p>
              <p><strong>Delivery Address:</strong> ${data.order.customer.address}, ${data.order.customer.city}, ${data.order.customer.district}</p>
              <p><strong>Payment Method:</strong> ${data.order.paymentMethod}</p>
              <p><strong>Total Payable:</strong> <strong style="color:var(--primary); font-size:1.1rem;">Rs. ${data.order.total.toLocaleString()}</strong></p>
            </div>
          `;
        }

        const trackBtn = document.getElementById('track-this-order-btn');
        if (trackBtn) {
          trackBtn.onclick = () => {
            this.closeCheckoutModal();
            this.openTrackingModal(data.order.orderId);
          };
        }

        this.cart = [];
        this.appliedCoupon = null;
        this.saveCart();
        this.showToast('Order successfully placed!', 'success');
      } else {
        this.showToast(data.message || 'Failed to place order', 'danger');
      }
    } catch (err) {
      console.error('Order error:', err);
      this.showToast('Network error while placing order. Please try again.', 'danger');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-check-circle"></i> Place Order Now`;
      }
    }
  }

  /* ========================================================================
     ORDER TRACKING MODAL
     ======================================================================== */
  openTrackingModal(presetId = '') {
    const modal = document.getElementById('tracking-modal-backdrop');
    const input = document.getElementById('track-input');
    if (!modal) return;

    if (input && presetId) {
      input.value = presetId;
      this.trackOrder(presetId);
    }

    modal.classList.remove('hidden');
  }

  closeTrackingModal() {
    const modal = document.getElementById('tracking-modal-backdrop');
    if (modal) modal.classList.add('hidden');
  }

  async trackOrder(orderId) {
    const container = document.getElementById('tracking-status-display');
    if (!container) return;

    container.innerHTML = `<div style="text-align:center; padding:1.5rem;"><i class="fa-solid fa-spinner fa-spin"></i> Fetching order status...</div>`;
    container.classList.remove('hidden');

    try {
      const res = await fetch(`${this.apiBase}/orders/${encodeURIComponent(orderId)}`);
      const data = await res.json();

      if (data.success && data.order) {
        const o = data.order;
        container.innerHTML = `
          <div class="timeline-card">
            <div class="timeline-header">
              <div>
                <h4>Order ${o.orderId}</h4>
                <span style="font-size:0.8rem; color:var(--text-muted);">Placed on: ${new Date(o.createdAt).toLocaleDateString('en-US', { dateStyle: 'long' })}</span>
              </div>
              <span class="order-status-pill">${o.orderStatus}</span>
            </div>

            <div style="font-size:0.85rem; margin-bottom:1.5rem; background:#ffffff; padding:1rem; border-radius:6px; border:1px solid var(--border-color);">
              <p><strong>Deliver To:</strong> ${o.customer.name} - ${o.customer.address}, ${o.customer.city}</p>
              <p><strong>Payment:</strong> ${o.paymentMethod} • Status: <strong>${o.paymentStatus}</strong></p>
              <p><strong>Total:</strong> Rs. ${o.total.toLocaleString()} (${o.items.length} items)</p>
            </div>

            <div class="timeline-steps">
              ${o.trackingSteps.map(step => `
                <div class="timeline-step ${step.completed ? 'completed' : ''}">
                  <span class="timeline-step-dot"></span>
                  <div class="timeline-step-info">
                    <strong>${step.status}</strong>
                    <span>${step.time}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div style="text-align:center; padding:1.5rem; color:var(--danger); background:#fff1f2; border-radius:8px;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:1.5rem; margin-bottom:0.5rem;"></i>
            <p>${data.message || 'Order reference not found'}</p>
          </div>
        `;
      }
    } catch {
      container.innerHTML = `<div style="color:var(--danger); text-align:center; padding:1rem;">Failed to fetch tracking data.</div>`;
    }
  }

  /* ========================================================================
     FILTERING HELPERS
     ======================================================================== */
  filterByCategory(catName) {
    this.filters.category = catName;
    this.filters.isSale = false;
    this.updateActiveNavs();
    this.fetchProducts();

    const catalogSection = document.getElementById('catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  filterBySpecial(type) {
    if (type === 'sale') {
      this.filters.isSale = true;
      this.filters.isNew = false;
      this.filters.isBestSeller = false;
    } else if (type === 'bestseller') {
      this.filters.isBestSeller = true;
      this.filters.isSale = false;
      this.filters.isNew = false;
    } else if (type === 'new') {
      this.filters.isNew = true;
      this.filters.isSale = false;
      this.filters.isBestSeller = false;
    }
    this.updateActiveNavs();
    this.fetchProducts();

    const catalogSection = document.getElementById('catalog');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  updateActiveNavs() {
    document.querySelectorAll('.nav-link').forEach(link => {
      const cat = link.getAttribute('data-category');
      const isSpecial = link.getAttribute('data-filter');

      if (this.filters.isSale && isSpecial === 'sale') {
        link.classList.add('active');
      } else if (!this.filters.isSale && cat === this.filters.category) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    document.querySelectorAll('.mobile-nav-item').forEach(link => {
      const cat = link.getAttribute('data-category');
      if (cat === this.filters.category) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  /* ========================================================================
     HERO SLIDER
     ======================================================================== */
  initSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dotsContainer = document.getElementById('slider-dots');
    if (!slides.length || !dotsContainer) return;

    dotsContainer.innerHTML = Array.from(slides).map((_, i) => `
      <span class="slider-dot ${i === 0 ? 'active' : ''}" onclick="app.goToSlide(${i})"></span>
    `).join('');

    const startInterval = () => {
      this.slideInterval = setInterval(() => {
        this.nextSlide();
      }, 5500);
    };

    startInterval();

    const sliderSection = document.querySelector('.hero-slider-section');
    if (sliderSection) {
      sliderSection.addEventListener('mouseenter', () => clearInterval(this.slideInterval));
      sliderSection.addEventListener('mouseleave', () => startInterval());
    }
  }

  goToSlide(idx) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.slider-dot');
    if (!slides.length) return;

    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));

    this.currentSlide = (idx + slides.length) % slides.length;
    slides[this.currentSlide].classList.add('active');
    if (dots[this.currentSlide]) dots[this.currentSlide].classList.add('active');
  }

  nextSlide() {
    this.goToSlide(this.currentSlide + 1);
  }

  prevSlide() {
    this.goToSlide(this.currentSlide - 1);
  }

  /* ========================================================================
     COUNTDOWN TIMER
     ======================================================================== */
  initCountdown() {
    let remaining = 14 * 3600 + 35 * 60 + 42;
    const hoursEl = document.getElementById('countdown-hours');
    const minsEl = document.getElementById('countdown-minutes');
    const secsEl = document.getElementById('countdown-seconds');

    setInterval(() => {
      if (remaining > 0) remaining--;
      const h = Math.floor(remaining / 3600);
      const m = Math.floor((remaining % 3600) / 60);
      const s = remaining % 60;

      if (hoursEl) hoursEl.textContent = String(h).padStart(2, '0');
      if (minsEl) minsEl.textContent = String(m).padStart(2, '0');
      if (secsEl) secsEl.textContent = String(s).padStart(2, '0');
    }, 1000);
  }

  /* ========================================================================
     EVENT BINDINGS
     ======================================================================== */
  bindEvents() {
    // Delegated click handler for login/signup buttons and auth actions
    document.addEventListener('click', (e) => {
      const loginTrigger = e.target.closest('#header-login-btn, [data-auth-action="login"]');
      if (loginTrigger) {
        e.preventDefault();
        this.openAuthModal('login');
        return;
      }

      const signupTrigger = e.target.closest('#header-signup-btn, [data-auth-action="register"]');
      if (signupTrigger) {
        e.preventDefault();
        this.openAuthModal('register');
        return;
      }

      const clerkTrigger = e.target.closest('#clerk-sso-btn');
      if (clerkTrigger) {
        e.preventDefault();
        this.handleThirdPartyAuth('clerk');
        return;
      }

      const demoTrigger = e.target.closest('.btn-demo-fill');
      if (demoTrigger) {
        e.preventDefault();
        this.fillDemoAccount();
        return;
      }
    });

    // Auth Modal events
    document.getElementById('close-auth-modal')?.addEventListener('click', () => this.closeAuthModal());
    document.getElementById('close-my-orders-modal')?.addEventListener('click', () => this.closeMyOrdersModal());
    document.getElementById('tab-login-btn')?.addEventListener('click', () => this.switchAuthTab('login'));
    document.getElementById('tab-register-btn')?.addEventListener('click', () => this.switchAuthTab('register'));
    document.getElementById('login-form')?.addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('register-form')?.addEventListener('submit', (e) => this.handleRegister(e));

    // Close user dropdown when clicking anywhere else
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.user-profile-menu-wrap')) {
        const menu = document.getElementById('user-dropdown-menu');
        if (menu) menu.classList.add('hidden');
      }
    });

    // Header cart toggle
    document.getElementById('open-cart-btn')?.addEventListener('click', () => this.openCart());
    document.getElementById('close-cart-btn')?.addEventListener('click', () => this.closeCart());
    document.getElementById('cart-backdrop')?.addEventListener('click', () => this.closeCart());

    // Filter drawer toggle
    document.getElementById('filter-drawer-btn')?.addEventListener('click', () => this.openFilterDrawer());
    document.getElementById('close-filter-drawer')?.addEventListener('click', () => this.closeFilterDrawer());
    document.getElementById('filter-backdrop')?.addEventListener('click', () => this.closeFilterDrawer());

    // Mobile nav drawer
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => this.openMobileNav());
    document.getElementById('close-mobile-drawer')?.addEventListener('click', () => this.closeMobileNav());
    document.getElementById('mobile-drawer-backdrop')?.addEventListener('click', () => this.closeMobileNav());

    // Slider arrows
    document.getElementById('slider-prev')?.addEventListener('click', () => this.prevSlide());
    document.getElementById('slider-next')?.addEventListener('click', () => this.nextSlide());

    // Category navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const cat = link.getAttribute('data-category');
        const isSpecial = link.getAttribute('data-filter');
        if (isSpecial === 'sale') {
          this.filterBySpecial('sale');
        } else if (cat) {
          this.filterByCategory(cat);
        }
      });
    });

    document.querySelectorAll('.mobile-nav-item').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeMobileNav();
        const cat = link.getAttribute('data-category');
        const isSpecial = link.getAttribute('data-filter');
        if (isSpecial === 'sale') {
          this.filterBySpecial('sale');
        } else if (cat) {
          this.filterByCategory(cat);
        }
      });
    });

    // Quick catalog tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.getAttribute('data-tab');

        if (target === 'all') {
          this.filters.isSale = false;
          this.filters.isNew = false;
          this.filters.isBestSeller = false;
        } else if (target === 'bestseller') {
          this.filters.isBestSeller = true;
          this.filters.isSale = false;
          this.filters.isNew = false;
        } else if (target === 'new') {
          this.filters.isNew = true;
          this.filters.isSale = false;
          this.filters.isBestSeller = false;
        } else if (target === 'sale') {
          this.filters.isSale = true;
          this.filters.isNew = false;
          this.filters.isBestSeller = false;
        }

        this.fetchProducts();
      });
    });

    // Sort select
    document.getElementById('sort-select')?.addEventListener('change', (e) => {
      this.filters.sort = e.target.value;
      this.fetchProducts();
    });

    // Search input with debounce
    let searchTimeout;
    const searchInput = document.getElementById('global-search-input');
    const searchDropdown = document.getElementById('search-dropdown');
    const searchResults = document.getElementById('search-dropdown-results');
    const clearSearchBtn = document.getElementById('clear-search-btn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        clearTimeout(searchTimeout);

        if (clearSearchBtn) {
          if (val) clearSearchBtn.classList.remove('hidden');
          else clearSearchBtn.classList.add('hidden');
        }

        if (val.length >= 2) {
          const matches = this.products.filter(p =>
            p.name.toLowerCase().includes(val.toLowerCase()) ||
            p.category.toLowerCase().includes(val.toLowerCase())
          ).slice(0, 5);

          if (searchResults && searchDropdown) {
            if (matches.length > 0) {
              searchResults.innerHTML = matches.map(m => `
                <div class="search-result-item" onclick="app.openQuickView('${m.id}'); document.getElementById('search-dropdown').classList.add('hidden');">
                  <img src="${m.images[0]}" alt="${m.name}" class="search-item-img">
                  <div class="search-item-info">
                    <h5>${m.name}</h5>
                    <span class="search-item-cat">${m.category} • ${m.brand || 'Signature'}</span>
                  </div>
                  <span class="search-item-price">Rs. ${m.price.toLocaleString()}</span>
                </div>
              `).join('');
            } else {
              searchResults.innerHTML = `<div class="search-no-results">No bags match "${val}". Press Enter to view catalog.</div>`;
            }
            searchDropdown.classList.remove('hidden');
          }
        } else {
          if (searchDropdown) searchDropdown.classList.add('hidden');
        }

        searchTimeout = setTimeout(() => {
          this.filters.search = val;
          this.fetchProducts();
        }, 350);
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.header-search') && searchDropdown) {
          searchDropdown.classList.add('hidden');
        }
      });
    }

    clearSearchBtn?.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      clearSearchBtn.classList.add('hidden');
      if (searchDropdown) searchDropdown.classList.add('hidden');
      this.filters.search = '';
      this.fetchProducts();
    });

    // Drawer filter price range slider
    const priceSlider = document.getElementById('price-range-slider');
    const priceMaxVal = document.getElementById('price-max-val');
    if (priceSlider && priceMaxVal) {
      priceSlider.addEventListener('input', (e) => {
        priceMaxVal.textContent = Number(e.target.value).toLocaleString();
      });
    }

    // Drawer apply filters button
    document.getElementById('apply-filters-btn')?.addEventListener('click', () => {
      const selectedCat = document.querySelector('input[name="drawer-cat"]:checked')?.value || 'All';
      const maxPrice = Number(priceSlider?.value || 30000);
      const isSale = document.getElementById('filter-check-sale')?.checked || false;
      const isNew = document.getElementById('filter-check-new')?.checked || false;
      const isBestSeller = document.getElementById('filter-check-bestseller')?.checked || false;

      this.filters.category = selectedCat;
      this.filters.maxPrice = maxPrice;
      this.filters.isSale = isSale;
      this.filters.isNew = isNew;
      this.filters.isBestSeller = isBestSeller;

      this.closeFilterDrawer();
      this.updateActiveNavs();
      this.fetchProducts();
    });

    document.getElementById('reset-filters-btn')?.addEventListener('click', () => {
      this.resetAllFilters();
      this.closeFilterDrawer();
    });

    document.getElementById('clear-all-filters-btn')?.addEventListener('click', () => {
      this.resetAllFilters();
    });

    // Coupon apply in cart
    document.getElementById('apply-coupon-btn')?.addEventListener('click', () => this.applyCoupon());
    document.getElementById('cart-coupon-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.applyCoupon();
      }
    });

    // Checkout modal triggers
    document.getElementById('proceed-to-checkout-btn')?.addEventListener('click', () => this.openCheckoutModal());
    document.getElementById('close-checkout-modal')?.addEventListener('click', () => this.closeCheckoutModal());
    document.getElementById('checkout-form')?.addEventListener('submit', (e) => this.handleOrderSubmit(e));
    document.getElementById('continue-shopping-btn')?.addEventListener('click', () => this.closeCheckoutModal());

    // Tracking modal triggers
    document.getElementById('open-track-modal-btn')?.addEventListener('click', () => this.openTrackingModal());
    document.getElementById('top-track-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.openTrackingModal();
    });
    document.getElementById('close-tracking-modal')?.addEventListener('click', () => this.closeTrackingModal());

    document.getElementById('search-track-btn')?.addEventListener('click', () => {
      const val = document.getElementById('track-input')?.value.trim();
      if (val) this.trackOrder(val);
    });

    document.getElementById('demo-track-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      const val = 'BB-2026-7842';
      const input = document.getElementById('track-input');
      if (input) input.value = val;
      this.trackOrder(val);
    });

    // Wishlist modal triggers
    document.getElementById('open-wishlist-btn')?.addEventListener('click', () => this.openWishlistModal());
    document.getElementById('close-wishlist-modal')?.addEventListener('click', () => {
      document.getElementById('wishlist-modal-backdrop')?.classList.add('hidden');
    });

    // Quickview close
    document.getElementById('close-quickview-modal')?.addEventListener('click', () => {
      document.getElementById('quickview-modal-backdrop')?.classList.add('hidden');
    });

    // Close modals on clicking background
    ['quickview-modal-backdrop', 'wishlist-modal-backdrop', 'tracking-modal-backdrop', 'auth-modal-backdrop', 'my-orders-modal-backdrop'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', (e) => {
        if (e.target.id === id) {
          document.getElementById(id).classList.add('hidden');
        }
      });
    });

    // Newsletter form
    document.getElementById('newsletter-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletter-email');
      if (!emailInput) return;

      const email = emailInput.value.trim();
      try {
        const res = await fetch(`${this.apiBase}/newsletter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (data.success) {
          this.showToast(data.message, 'success');
          emailInput.value = '';
          const couponInput = document.getElementById('cart-coupon-input');
          if (couponInput) couponInput.value = data.code;
        } else {
          this.showToast(data.message, 'danger');
        }
      } catch {
        this.showToast('Subscription error. Please try again.', 'danger');
      }
    });
  }

  /* ========================================================================
     TOAST NOTIFICATIONS
     ======================================================================== */
  showToast(message, type = 'default') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'danger' ? 'toast-danger' : ''}`;
    toast.innerHTML = `
      <i class="${type === 'success' ? 'fa-solid fa-circle-check text-success' : type === 'danger' ? 'fa-solid fa-circle-exclamation text-danger' : 'fa-solid fa-bell'}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }
}

// Instantiate app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new BrightBuyApp();
});
