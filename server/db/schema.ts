import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  priceLkr: integer('price_lkr').notNull(),
  compareAtPriceLkr: integer('compare_at_price_lkr'),
  stockQty: integer('stock_qty').notNull().default(0),
  imagesJson: text('images_json').notNull().default('[]'),
  specsJson: text('specs_json').notNull().default('{}'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderNumber: text('order_number').notNull().unique(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email'),
  shippingAddress: text('shipping_address').notNull(),
  city: text('city').notNull(),
  notes: text('notes'),
  status: text('status', {
    enum: ['PENDING', 'CONFIRMED', 'PACKING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  })
    .notNull()
    .default('PENDING'),
  isPreorder: integer('is_preorder', { mode: 'boolean' }).notNull().default(false),
  subtotalLkr: integer('subtotal_lkr').notNull(),
  shippingLkr: integer('shipping_lkr').notNull(),
  totalLkr: integer('total_lkr').notNull(),
  trackingCode: text('tracking_code'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const orderItems = sqliteTable('order_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderId: integer('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  productNameSnapshot: text('product_name_snapshot').notNull(),
  unitPriceLkr: integer('unit_price_lkr').notNull(),
  quantity: integer('quantity').notNull(),
});

export const storeSettings = sqliteTable('store_settings', {
  id: integer('id').primaryKey(),
  isOpen: integer('is_open', { mode: 'boolean' }).notNull().default(true),
  closedMessage: text('closed_message')
    .notNull()
    .default('We are currently closed. Pre-orders are open and will be dispatched when we reopen.'),
  businessHours: text('business_hours').notNull().default('Mon – Sat, 9:00 AM – 6:00 PM'),
  shippingFeeLkr: integer('shipping_fee_lkr').notNull().default(650),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const subscribers = sqliteTable('subscribers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  clerkId: text('clerk_id').unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ['CUSTOMER', 'ADMIN'] })
    .notNull()
    .default('CUSTOMER'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
});
