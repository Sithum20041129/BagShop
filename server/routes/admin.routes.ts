import { Hono } from 'hono';
import type { Env } from '../types';
import { createDb } from '../db';
import { ProductService } from '../services/product.service';
import { OrderService } from '../services/order.service';
import { StoreService } from '../services/store.service';
import { MediaService } from '../services/media.service';
import {
  adminAuthMiddleware,
  clearAdminSessionCookie,
  createAdminSessionCookie,
  isValidAdminSession,
  verifyPasscodeConstantTime,
} from '../middlewares/admin-auth';
import { parseJsonBody } from '../middlewares/validate';
import { AppError } from '../middlewares/error';
import { AdminLoginSchema, UpdateStoreSettingsSchema } from '@shared/schemas/store.schema';
import { CreateProductSchema, UpdateProductSchema } from '@shared/schemas/product.schema';
import { UpdateOrderStatusSchema } from '@shared/schemas/order.schema';

const adminRoutes = new Hono<{ Bindings: Env }>();

// Public Admin Auth Endpoints
adminRoutes.post('/login', async (c) => {
  const { passcode } = await parseJsonBody(c, AdminLoginSchema);
  const expected = c.env.ADMIN_PASSCODE || 'brightbuy2026';

  if (!verifyPasscodeConstantTime(passcode, expected)) {
    throw new AppError('Invalid admin passcode', 401);
  }

  await createAdminSessionCookie(c);
  return c.json({ success: true, message: 'Admin session authenticated' });
});

adminRoutes.post('/logout', (c) => {
  clearAdminSessionCookie(c);
  return c.json({ success: true, message: 'Logged out' });
});

adminRoutes.get('/me', async (c) => {
  const authenticated = await isValidAdminSession(c);
  return c.json({ success: true, authenticated });
});

// Protect all routes below with Stage 1 Passcode Cookie Guard
adminRoutes.use('/*', adminAuthMiddleware);

// Admin Products
adminRoutes.get('/products', async (c) => {
  const db = createDb(c.env.DB);
  const service = new ProductService(db);
  const products = await service.listProducts({ includeInactive: true });
  return c.json({ success: true, products });
});

adminRoutes.post('/products', async (c) => {
  const body = await parseJsonBody(c, CreateProductSchema);
  const db = createDb(c.env.DB);
  const service = new ProductService(db);
  const product = await service.createProduct(body);
  return c.json({ success: true, product }, 201);
});

adminRoutes.patch('/products/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid product ID', 400);
  const body = await parseJsonBody(c, UpdateProductSchema);
  const db = createDb(c.env.DB);
  const service = new ProductService(db);
  const product = await service.updateProduct(id, body);
  return c.json({ success: true, product });
});

adminRoutes.delete('/products/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid product ID', 400);
  const db = createDb(c.env.DB);
  const service = new ProductService(db);
  await service.deleteProduct(id);
  return c.json({ success: true, message: 'Product removed' });
});

// Admin R2 Image Upload
adminRoutes.post('/upload', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    throw new AppError('Image file is required under field "file"', 400);
  }
  const mediaService = new MediaService(
    c.env.IMAGES_BUCKET,
    c.env.R2_PUBLIC_URL || '/api/media'
  );
  const uploaded = await mediaService.uploadImage(file);
  return c.json({ success: true, ...uploaded }, 201);
});

// Admin Orders
adminRoutes.get('/orders', async (c) => {
  const status = c.req.query('status');
  const preorderParam = c.req.query('preorder');
  const preorder =
    preorderParam === 'true' ? true : preorderParam === 'false' ? false : undefined;

  const db = createDb(c.env.DB);
  const service = new OrderService(db, c.env.DB);
  const orders = await service.listOrders({ status, preorder });
  return c.json({ success: true, orders });
});

adminRoutes.patch('/orders/:id/status', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) throw new AppError('Invalid order ID', 400);
  const body = await parseJsonBody(c, UpdateOrderStatusSchema);
  const db = createDb(c.env.DB);
  const service = new OrderService(db, c.env.DB);
  const order = await service.updateOrderStatus(id, body.status, body.trackingCode);
  return c.json({ success: true, order });
});

// Admin Store Settings (Open / Closed Pre-Order Toggle)
adminRoutes.patch('/store-status', async (c) => {
  const body = await parseJsonBody(c, UpdateStoreSettingsSchema);
  const db = createDb(c.env.DB);
  const service = new StoreService(db);
  const settings = await service.updateStatus(body);
  return c.json({ success: true, settings });
});

export default adminRoutes;
