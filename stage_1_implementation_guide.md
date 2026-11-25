# BagShop — Stage 1 Implementation Guide

**Objective:** Transform the current prototype (flat JSON files in `data/` and a monolithic frontend in `public/`) into a fast, maintainable, production-ready e-commerce platform deployed on **Cloudflare's free tier** using a unified TypeScript codebase.

---

## 1. Locked-In Project Decisions

* **Language:** Strict **TypeScript** across `shared/`, `server/`, and `client/`.
* **Brand Aesthetic:** **Minimalist Luxury** — generous whitespace, refined editorial typography, muted neutral palette, and high-resolution bag photography.
* **Currency:** **Sri Lankan Rupees (`LKR`)**, stored as whole-number integers (e.g., `14500`) and formatted cleanly as `Rs. 14,500`.
* **Stage 1 Admin Access:** **Simple Admin Passcode** stored as a Cloudflare Worker Secret (`ADMIN_PASSCODE`) and verified via an `HttpOnly` session cookie in a single isolated middleware (making the Stage 2 swap to Clerk effortless).
* **Closed-Store Behavior:** **Pre-Orders Allowed** — toggling the store to *Closed* displays a refined notice banner, labels checkout as a **Pre-Order**, and tags incoming orders with `is_preorder: true` for the admin queue.

---

## 2. Stage 1 Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Platform & Hosting** | Cloudflare Workers (with Static Assets) | Hosts both the React frontend and API backend in one deployment with zero cold starts |
| **Backend Framework** | Hono (TypeScript) | Lightweight, Express-like API framework built for Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite) + Drizzle ORM | Replaces `data/*.json` with a relational SQL database and type-safe queries |
| **Media Storage** | Cloudflare R2 | Stores product images uploaded by admins with zero bandwidth fees |
| **Frontend Framework** | React + Vite (TypeScript) | Replaces `public/app.js` with a fast, modular component architecture |
| **Styling & UI** | Tailwind CSS + shadcn/ui + Lucide Icons | Provides a consistent, luxury e-commerce & clean admin design system |
| **State & Data Fetching** | TanStack Query + Zustand | Manages API caching, loading states, and persistent shopping cart state |
| **Validation** | Zod | Shared TypeScript schemas across frontend forms and backend routes |

---

## 3. Minimalist Luxury Design System

Configure these design tokens in `client/src/index.css` so the storefront immediately feels elevated and cohesive:

* **Color Palette:**
  * **Canvas / Background:** Warm Alabaster (`#FAFAF9`) and pure white (`#FFFFFF`) for cards/drawers.
  * **Primary Ink / CTAs:** Deep Charcoal / Espresso (`#1C1917`) with crisp white text.
  * **Secondary Text & Borders:** Warm Stone (`#78716C` for muted copy, `#E7E5E4` for hairline borders).
  * **Subtle Accent:** Warm Bronze / Cognac (`#92400E`) used sparingly for pre-order badges, active states, and highlights.
* **Typography:**
  * **Headings / Editorial Titles:** *Cormorant Garamond* or *Playfair Display* (elegant serif).
  * **UI, Body & Prices:** *Plus Jakarta Sans* or *Inter* (clean sans-serif with `tabular-nums` for aligned LKR prices).
* **Shape & Spacing:**
  * Use subtle border radii (`rounded-sm` or `rounded-none` on product cards and primary buttons) rather than overly bubbly pill shapes.
  * Prioritize generous padding, hairline dividers, and consistent `4:5` portrait aspect ratios on all bag photos.
* **LKR Formatting Utility (`client/src/lib/utils.ts`):**
  * Standardize all prices using a single helper (`formatLKR(amount: number)`) outputting `Rs. 14,500`.

---

## 4. Unified Project Structure

Keep the frontend, backend, and shared TypeScript types in one repository so a single Cloudflare deployment builds and publishes everything.

```text
bagshop/
├── wrangler.jsonc              # Cloudflare Workers, D1, R2, and Static Assets config
├── drizzle.config.ts           # Drizzle ORM migration config
├── tsconfig.json               # Root TypeScript configuration
├── package.json                # Unified scripts (dev, build, deploy, db:migrate)
├── migrations/                 # Auto-generated SQL migrations for D1
├── shared/                     # Shared Zod schemas & TypeScript types
│   └── schemas/
│       ├── product.schema.ts
│       ├── order.schema.ts
│       └── store.schema.ts
├── server/                     # Hono Backend (migrated from existing src/)
│   ├── index.ts                # Worker entry point & Hono app setup
│   ├── types.ts                # Cloudflare Env bindings (DB, IMAGES_BUCKET, ADMIN_PASSCODE)
│   ├── db/
│   │   ├── schema.ts           # Drizzle D1 table definitions
│   │   └── index.ts            # D1 client helper
│   ├── middlewares/
│   │   ├── admin-auth.ts       # Passcode cookie guard (swapped for Clerk in Stage 2)
│   │   ├── error.ts            # Global error handler
│   │   └── validate.ts         # Zod request validator
│   ├── routes/
│   │   ├── products.routes.ts
│   │   ├── orders.routes.ts
│   │   ├── store.routes.ts
│   │   └── admin.routes.ts
│   ├── services/               # Reused & adapted business logic from old src/services/
│   │   ├── product.service.ts
│   │   ├── order.service.ts
│   │   ├── store.service.ts
│   │   └── media.service.ts    # R2 image upload/delete handler
│   └── repositories/           # Drizzle D1 queries (replacing old JSON repositories)
└── client/                     # React + Vite Frontend (replacing old public/)
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx             # React Router setup (Storefront + Admin routes)
        ├── index.css           # Tailwind & Minimalist Luxury shadcn/ui tokens
        ├── lib/
        │   ├── api.ts          # Typed fetch wrapper for /api/*
        │   └── utils.ts        # cn() helper & formatLKR()
        ├── store/
        │   └── cart.store.ts   # Zustand persistent cart state
        ├── components/
        │   ├── ui/             # shadcn/ui components
        │   ├── store/          # Navbar, StoreBanner, ProductCard, CartDrawer, OrderStepper
        │   └── admin/          # AdminSidebar, PasscodeGate, ImageUploader, OrderDetailDrawer
        └── pages/
            ├── store/
            │   ├── HomePage.tsx
            │   ├── ProductsPage.tsx
            │   ├── ProductDetailPage.tsx
            │   ├── CheckoutPage.tsx
            │   └── TrackOrderPage.tsx
            └── admin/
                ├── AdminLoginPage.tsx
                ├── AdminDashboardPage.tsx
                ├── AdminProductsPage.tsx
                ├── AdminOrdersPage.tsx
                └── AdminSettingsPage.tsx
```

---

## 5. Step-by-Step Build Plan

### Step 1: Set Up Cloudflare Resources
1. Install `wrangler` and authenticate:
   ```bash
   npm install -D wrangler
   npx wrangler login
   ```
2. Create the **D1 database** and **R2 bucket**:
   ```bash
   npx wrangler d1 create bagshop-db
   npx wrangler r2 bucket create bagshop-images
   ```
   *(Enable the R2 Public Development URL or attach a custom subdomain like `media.yourdomain.com` in the Cloudflare dashboard.)*
3. Configure `wrangler.jsonc` with bindings for `DB`, `IMAGES_BUCKET`, and `assets` pointing to `client/dist` (`not_found_handling: "single-page-application"`).

### Step 2: Design & Migrate the D1 Database (`server/db/schema.ts`)
Replace `data/*.json` with normalized Drizzle SQLite tables:

* **`products`**: `id`, `slug` (unique), `name`, `description`, `category`, `price_lkr` (integer), `compare_at_price_lkr` (nullable integer), `stock_qty` (integer), `images_json` (JSON array of R2 URLs), `specs_json` (material, dimensions, weight, colors), `is_active` (boolean), `created_at`, `updated_at`.
* **`orders`**: `id`, `order_number` (e.g., `BG-1001`), `customer_name`, `customer_phone`, `customer_email`, `shipping_address`, `city`, `notes`, `status` (`PENDING` | `CONFIRMED` | `PACKING` | `SHIPPED` | `DELIVERED` | `CANCELLED`), `is_preorder` (boolean, default `false`), `subtotal_lkr`, `shipping_lkr`, `total_lkr`, `tracking_code`, `created_at`, `updated_at`.
* **`order_items`**: `id`, `order_id` (FK → `orders.id`), `product_id` (FK → `products.id`), `product_name_snapshot`, `unit_price_lkr`, `quantity`.
* **`store_settings`**: `id` (singleton row `1`), `is_open` (boolean), `closed_message` (text, e.g., *"We are currently closed. Pre-orders are open and will be dispatched when we reopen."*), `business_hours` (text), `shipping_fee_lkr` (integer), `updated_at`.
* **`subscribers`**: `id`, `email` (unique), `created_at`.
* **`users`**: `id`, `clerk_id` (nullable in Stage 1, ready for Stage 2), `email`, `name`, `role` (`CUSTOMER` | `ADMIN`), `created_at`.

**Migration & Seed:**
1. Generate migrations with Drizzle Kit and apply them locally (`--local`) and remotely (`--remote`).
2. Run a one-time TypeScript seed script to import your existing `data/products.json` items into D1 and create the initial `store_settings` row.

### Step 3: Build the Hono Backend API (`server/`)

#### Simple Admin Passcode Auth (Stage 1 Only)
* Store `ADMIN_PASSCODE` and `ADMIN_SESSION_SECRET` via `wrangler secret put` (and in `.dev.vars` for local dev).
* `POST /api/admin/login`: Verifies the submitted passcode using constant-time comparison and sets a signed `HttpOnly; Secure; SameSite=Strict` cookie (`bagshop_admin_session`).
* `POST /api/admin/logout`: Clears the admin session cookie.
* `server/middlewares/admin-auth.ts`: Verifies the signed cookie on all `/api/admin/*` routes (except `/login`). In Stage 2, replace only this middleware with `@clerk/express` + role check.

#### Public Storefront Endpoints
* `GET /api/store/status` — Returns `is_open`, `closed_message`, `business_hours`, and `shipping_fee_lkr`.
* `GET /api/products` — Supports `?category=`, `?search=`, `?sort=` (`newest`, `price_asc`, `price_desc`), and `?inStock=true`.
* `GET /api/products/:slug` — Returns single product details.
* `POST /api/orders` — Validates payload with Zod, reads `store_settings.is_open`, checks stock availability, automatically sets `is_preorder = !storeSettings.is_open`, and runs **`db.batch()`** to insert the order, insert `order_items`, and decrement `products.stock_qty` atomically.
* `GET /api/orders/track/:orderNumber` — Requires matching `phone` query param for privacy; returns order status, `is_preorder` flag, timestamps, and itemized summary.
* `POST /api/newsletter` — Saves email to `subscribers`.

#### Protected Admin Endpoints
* `POST /api/admin/products` — Create a new product.
* `PATCH /api/admin/products/:id` — Update details, LKR price, stock, or active status.
* `DELETE /api/admin/products/:id` — Soft-delete or remove a product.
* `POST /api/admin/upload` — Accepts multipart image upload (validates JPEG/PNG/WebP and max size), uploads to **Cloudflare R2**, and returns the public URL.
* `GET /api/admin/orders` — Filterable by status and pre-order flag (`?status=PENDING&preorder=true`).
* `PATCH /api/admin/orders/:id/status` — Confirm an order or update status/courier tracking code.
* `PATCH /api/admin/store-status` — Toggle `is_open`, edit `closed_message`, `business_hours`, and `shipping_fee_lkr`.

### Step 4: Build the React + shadcn/ui Frontend (`client/`)

Initialize Vite + React + TypeScript inside `client/`, configure Tailwind CSS, and install shadcn/ui components:
`button`, `card`, `input`, `textarea`, `label`, `badge`, `sheet`, `dialog`, `table`, `tabs`, `select`, `switch`, `skeleton`, `separator`, `sonner`.

#### Customer Storefront Pages & UX
1. **Top Announcement Bar & Editorial Navbar:**
   * Displays a refined slim banner when `is_open === false` (e.g., *"Store Closed — Pre-Orders Open. Orders will be confirmed once we reopen."*).
   * Clean sticky navbar with centered brand wordmark, minimal navigation links, Order Tracking link, and Cart trigger with item count.
2. **Home & Product Catalog:**
   * Full-bleed minimalist hero section highlighting your signature collection.
   * Clean `4:5` product cards with subtle hover image swap, refined stock pills (`Low Stock`, `Sold Out`), and LKR pricing.
   * Minimal filter/sort bar + Skeleton loaders during D1 fetches.
3. **Product Detail Page (PDP):**
   * Large editorial photo gallery (R2 images with `loading="lazy"`), clear LKR price, craftsmanship/dimension specs, stock indicator, quantity selector, and sticky mobile **"Add to Cart"** bar.
4. **Slide-Over Cart Drawer (`Sheet`):**
   * Displays thumbnails, quantity steppers, LKR line totals, calculated subtotal, and a **Proceed to Checkout** button.
5. **Checkout Page (with Pre-Order UX):**
   * Two-column desktop layout (Delivery Form on the left, Sticky Order Summary on the right) with inline Zod validation.
   * If `is_open === false`, displays an inline warm-stone **Pre-Order Notice** card above the summary and updates the primary CTA button from **"Place Order"** to **"Place Pre-Order"**.
6. **Order Tracking Page:**
   * Clean lookup form (Order Number + Phone Number).
   * Visual horizontal/vertical progress stepper (`Pending` → `Confirmed` → `Packing` → `Shipped` → `Delivered`), plus a `Pre-Order` badge if placed while closed.

#### Admin Panel Pages & UX
1. **Passcode Login Screen (`AdminLoginPage.tsx`):**
   * Clean centered passcode input card that authenticates via `POST /api/admin/login`.
2. **Admin Shell:**
   * Fixed left sidebar (`Overview`, `Products`, `Orders`, `Store Settings`) + top bar showing live **Store Open / Closed (Pre-Order Mode)** status and Logout button.
3. **Product Manager:**
   * Searchable table with thumbnails, LKR price, stock count, and Edit/Delete controls.
   * Add/Edit sheet/modal with a **drag-and-drop R2 image uploader** showing live previews.
4. **Order Manager:**
   * Filter tabs (`All`, `Pending`, `Pre-Orders`, `Confirmed`, `Shipped`, `Delivered`).
   * Distinct `Pre-Order` pill on orders placed while closed. Clicking any row opens a slide-over detail drawer with customer info, itemized bags, and a **1-click Confirm Order** button.
5. **Store Settings:**
   * Instant **Store Open / Closed** toggle (`Switch`) with clear helper text (*"When closed, customers will see your notice banner and can continue placing pre-orders"*), custom message editor, business hours, and default LKR shipping fee.

### Step 5: Local Development & Production Deployment
1. **Local Dev:** Use `@cloudflare/vite-plugin` so a single `npm run dev` command launches the React dev server (HMR) and the Hono Worker backed by local D1 and R2 emulators.
2. **Production Secrets:**
   ```bash
   npx wrangler secret put ADMIN_PASSCODE
   npx wrangler secret put ADMIN_SESSION_SECRET
   ```
3. **Build & Deploy:**
   ```bash
   npm run build
   npx wrangler deploy
   ```

---

## 6. Stage 1 Completion Checklist (Ready for Stage 2)

* [ ] All JSON files in `data/` migrated to Cloudflare D1 via Drizzle with integer LKR pricing.
* [ ] Product images upload cleanly to Cloudflare R2 and render in `4:5` minimalist luxury cards.
* [ ] Customers can browse, filter, add to cart, check out (including pre-orders when closed), and track orders.
* [ ] Admins can log in with the Stage 1 passcode, manage products, confirm orders, and toggle Open/Closed (Pre-Order) mode.
* [ ] Deployed live on Cloudflare Workers with zero TypeScript, console, or API errors.
* [ ] `users.clerk_id` column and isolated `admin-auth.ts` middleware are in place—ready for **Stage 2 (Clerk + WhatsApp Cloud API)**.