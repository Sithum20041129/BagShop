import { Hono } from 'hono';
import type { Env } from '../types';
import { createDb } from '../db';
import { ProductService } from '../services/product.service';
import { OrderService } from '../services/order.service';
import { StoreService } from '../services/store.service';
import { MediaService } from '../services/media.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { adminAuthMiddleware } from '../middlewares/admin-auth';
import { parseJsonBody } from '../middlewares/validate';
import { AppError } from '../middlewares/error';
import { UpdateStoreSettingsSchema } from '@shared/schemas/store.schema';
import { CreateProductSchema, UpdateProductSchema } from '@shared/schemas/product.schema';
import { UpdateOrderStatusSchema } from '@shared/schemas/order.schema';

const adminRoutes = new Hono<{ Bindings: Env }>();

// All admin routes require verified Clerk JWT with ADMIN role
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

// Admin WhatsApp Integration Status & Test Alert
adminRoutes.get('/whatsapp-status', (c) => {
  const whatsapp = new WhatsAppService(c.env);
  return c.json({
    success: true,
    configured: whatsapp.isConfigured(),
  });
});

adminRoutes.post('/whatsapp-test', async (c) => {
  const whatsapp = new WhatsAppService(c.env);
  const result = await whatsapp.sendTextMessage(
    '✅ *Bright Buy WhatsApp Test*\nYour admin order notification channel is connected and ready.'
  );
  return c.json({ success: true, ...result });
});

export default adminRoutes;
