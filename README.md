# Bright Buy - Premium Bags & Leather Goods Store 👜🇱🇰

An enterprise-ready e-commerce platform for **Bright Buy** (bags, backpacks, totes, travel duffles, clutches, and leather goods), inspired by **DSI Foot Candy** ([dsifootcandy.lk](https://dsifootcandy.lk/)).

Engineered with a **Production-Grade Layered Architecture** in JavaScript (Node.js & Express).

---

## 🏗️ Production Layered Architecture

```
bags-website/
├── src/
│   ├── config/                     # Configuration Layer
│   │   ├── env.config.js           # Centralized environment variable validation
│   │   └── security.config.js      # Helmet CSP, CORS policies & Rate Limiting
│   │
│   ├── middlewares/                # Middleware Layer
│   │   ├── security.middleware.js  # Helmet, Rate Limiter, input sanitization
│   │   ├── auth.middleware.js      # JWT & Clerk Token verification (RBAC guards)
│   │   ├── validation.middleware.js# Schema & payload validation
│   │   └── error.middleware.js     # Centralized 404 & 500 production error handler
│   │
│   ├── routes/                     # Routing Layer
│   │   ├── index.js                # Master API router (/api/v1/ and /api/ alias)
│   │   ├── auth.routes.js          # /auth (login, register, me, clerk-sync)
│   │   ├── product.routes.js       # /products (catalog & filters)
│   │   ├── category.routes.js      # /categories (counts & navigation)
│   │   ├── order.routes.js         # /orders (checkout & tracking)
│   │   ├── coupon.routes.js        # /coupons (promo validation)
│   │   └── newsletter.routes.js    # /newsletter (VIP subscription)
│   │
│   ├── controllers/                # Controller Layer (HTTP Transport)
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── order.controller.js
│   │   └── marketing.controller.js
│   │
│   ├── services/                   # Service Layer (Business Logic)
│   │   ├── auth.service.js         # JWT signing, password hashing, Clerk user sync
│   │   ├── product.service.js      # Filtering, search algorithms, catalog stats
│   │   ├── order.service.js        # Order validation, shipping rules, tracking
│   │   └── marketing.service.js    # Voucher calculation & newsletter
│   │
│   ├── repositories/               # Repository Layer (Data Access)
│   │   ├── base.repository.js      # Abstract data access interface
│   │   ├── user.repository.js      # User management & Clerk ID binding
│   │   ├── product.repository.js   # Products retrieval
│   │   ├── order.repository.js     # Orders & live tracking steps
│   │   └── marketing.repository.js # Coupons & subscribers
│   │
│   └── app.js                      # Express application pipeline
│
├── data/                           # Data storage (pluggable to MongoDB/PostgreSQL)
│   ├── users.json
│   ├── products.json
│   ├── orders.json
│   └── subscribers.json
│
├── public/                         # Frontend Storefront
│   ├── index.html                  # Storefront & Auth Modals
│   ├── styles.css                  # Responsive DSI Foot Candy styling
│   └── app.js                      # State, cart, wishlist, and auth management
│
├── .env                            # Active environment configuration
├── .env.example                    # Environment template
├── server.js                       # Server entry point & graceful shutdown
└── package.json
```

---

## 🛡️ Security Layer

1. **Helmet HTTP Headers**:
   - Comprehensive Content Security Policy (CSP), Frameguard (`X-Frame-Options`), MIME-type sniffing defense (`X-Content-Type-Options: nosniff`), and XSS filters.
2. **DDoS & Brute Force Rate Limiting**:
   - Global API Rate Limiter (300 requests / 15 mins).
   - Strict Authentication Rate Limiter (15 attempts / 15 mins) on `/auth/login` and `/auth/register`.
3. **CORS Control**:
   - Production origin whitelisting with pre-flight caching.
4. **Input Sanitization**:
   - Trims and normalizes all incoming payload strings.

---

## 🔐 Authentication Layer & Clerk Integration

The authentication layer is designed to support both standard **JWT** and third-party services like **[Clerk](https://clerk.com/)**:

- **Bearer Token Verification**: Automatically verifies Bearer JWT tokens in the `Authorization` header on all protected routes.
- **Clerk Ready**:
  - Configured with `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env`.
  - Endpoint `POST /api/v1/auth/clerk-sync` to seamlessly bind Clerk authenticated users with local order histories.
- **Frontend Auth UI**:
  - "Login" and "Sign Up" buttons in the navigation header.
  - Interactive dual-tab modal with Clerk SSO button and quick "Fill Demo Account" helper.
  - Logged-in user avatar pill with dropdown menu (*My Orders, Wishlist, Order Tracking, Sign Out*).

---

## 🔑 Demo Customer Account
- **Email**: `customer@brightbuy.lk`
- **Password**: `Password123!`

---

## 🚀 Running the Server

```bash
# Start production server
npm start

# Start development with auto-reload
npm run dev
```
Open **`http://localhost:3000`** in your browser.
