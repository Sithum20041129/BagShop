import fs from 'node:fs';
import path from 'node:path';

interface LegacyProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stockCount?: number;
  images?: string[];
  colors?: { name: string; hex: string }[];
  description?: string;
  features?: string[];
  specs?: Record<string, string>;
}

interface LegacyOrder {
  orderId: string;
  createdAt: string;
  customer: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    city: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  orderStatus: string;
  deliveryNotes?: string;
}

function sqlEscape(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL';
  return `'${val.replace(/'/g, "''")}'`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const rootDir = process.cwd();
const productsRaw = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data', 'products.json'), 'utf-8')
) as LegacyProduct[];
const ordersRaw = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data', 'orders.json'), 'utf-8')
) as LegacyOrder[];
const subscribersRaw = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'data', 'subscribers.json'), 'utf-8')
) as { email: string; subscribedAt?: string }[];

const lines: string[] = [
  '-- Auto-generated D1 seed from legacy data/*.json',
  '',
  "INSERT OR IGNORE INTO store_settings (id, is_open, closed_message, business_hours, shipping_fee_lkr, updated_at) VALUES (1, 1, 'We are currently closed. Pre-orders are open and will be dispatched when we reopen.', 'Mon – Sat, 9:00 AM – 6:00 PM', 650, datetime('now'));",
  '',
];

const usedSlugs = new Set<string>();
const legacyIdToSlug = new Map<string, string>();

for (const p of productsRaw) {
  let slug = slugify(p.name);
  if (usedSlugs.has(slug)) {
    slug = `${slug}-${p.id}`;
  }
  usedSlugs.add(slug);
  legacyIdToSlug.set(p.id, slug);

  const specs = {
    material: p.specs?.material || 'Full-Grain Leather',
    dimensions: p.specs?.dimensions || '35cm x 26cm x 12cm',
    weight: p.specs?.weight || '750g',
    capacity: p.specs?.capacity,
    warranty: p.specs?.warranty || '1 Year Islandwide Guarantee',
    colors: p.colors || [],
    features: p.features || [],
  };

  const images = p.images && p.images.length > 0 ? p.images : [
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
  ];

  lines.push(
    `INSERT OR IGNORE INTO products (slug, name, description, category, price_lkr, compare_at_price_lkr, stock_qty, images_json, specs_json, is_active, created_at, updated_at) VALUES (${sqlEscape(
      slug
    )}, ${sqlEscape(p.name)}, ${sqlEscape(
      p.description || 'Crafted minimalist luxury bag.'
    )}, ${sqlEscape(p.category)}, ${Math.round(p.price)}, ${
      p.originalPrice ? Math.round(p.originalPrice) : 'NULL'
    }, ${p.stockCount ?? 15}, ${sqlEscape(JSON.stringify(images))}, ${sqlEscape(
      JSON.stringify(specs)
    )}, 1, datetime('now'), datetime('now'));`
  );
}

lines.push('');

function mapLegacyStatus(status: string): string {
  switch (status) {
    case 'Confirmed':
      return 'CONFIRMED';
    case 'Dispatched with Courier':
      return 'SHIPPED';
    case 'Delivered':
      return 'DELIVERED';
    case 'Discarded':
    case 'Cancelled':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

for (const o of ordersRaw) {
  const status = mapLegacyStatus(o.orderStatus);
  lines.push(
    `INSERT OR IGNORE INTO orders (order_number, customer_name, customer_phone, customer_email, shipping_address, city, notes, status, is_preorder, subtotal_lkr, shipping_lkr, total_lkr, tracking_code, created_at, updated_at) VALUES (${sqlEscape(
      o.orderId
    )}, ${sqlEscape(o.customer.name)}, ${sqlEscape(o.customer.phone)}, ${sqlEscape(
      o.customer.email || null
    )}, ${sqlEscape(o.customer.address)}, ${sqlEscape(o.customer.city)}, ${sqlEscape(
      o.deliveryNotes || null
    )}, ${sqlEscape(status)}, 0, ${Math.round(o.subtotal)}, ${Math.round(
      o.shippingFee
    )}, ${Math.round(o.total)}, NULL, ${sqlEscape(o.createdAt)}, datetime('now'));`
  );

  for (const item of o.items) {
    const prodSlug = legacyIdToSlug.get(item.id) || slugify(item.name);
    lines.push(
      `INSERT INTO order_items (order_id, product_id, product_name_snapshot, unit_price_lkr, quantity) SELECT o.id, COALESCE((SELECT id FROM products WHERE slug = ${sqlEscape(
        prodSlug
      )}), (SELECT id FROM products LIMIT 1)), ${sqlEscape(item.name)}, ${Math.round(
        item.price
      )}, ${item.quantity} FROM orders o WHERE o.order_number = ${sqlEscape(
        o.orderId
      )} AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id AND oi.product_name_snapshot = ${sqlEscape(
        item.name
      )});`
    );
  }
}

lines.push('');
for (const sub of subscribersRaw) {
  lines.push(
    `INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (${sqlEscape(
      sub.email.toLowerCase()
    )}, ${sqlEscape(sub.subscribedAt || new Date().toISOString())});`
  );
}

fs.writeFileSync(path.join(rootDir, 'scripts', 'seed.sql'), lines.join('\n'), 'utf-8');
console.log(`Generated scripts/seed.sql with ${productsRaw.length} products and ${ordersRaw.length} orders.`);
