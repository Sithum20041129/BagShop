import { Hono } from 'hono';
import type { Env } from '../types';
import { createDb } from '../db';
import { OrderService } from '../services/order.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { parseJsonBody } from '../middlewares/validate';
import { CreateOrderSchema, TrackOrderQuerySchema } from '@shared/schemas/order.schema';

const ordersRoutes = new Hono<{ Bindings: Env }>();

ordersRoutes.post('/', async (c) => {
  const body = await parseJsonBody(c, CreateOrderSchema);
  const db = createDb(c.env.DB);
  const service = new OrderService(db, c.env.DB);
  const order = await service.createOrder(body);

  // Notify Admin via WhatsApp Cloud API without blocking checkout response
  const whatsapp = new WhatsAppService(c.env);
  const alertPromise = whatsapp.sendNewOrderAlert(order);
  try {
    c.executionCtx.waitUntil(alertPromise);
  } catch {
    await alertPromise;
  }

  return c.json({ success: true, order }, 201);
});

ordersRoutes.get('/track/:orderNumber', async (c) => {
  const orderNumber = c.req.param('orderNumber');
  const { phone } = TrackOrderQuerySchema.parse({
    phone: c.req.query('phone') || '',
  });
  const db = createDb(c.env.DB);
  const service = new OrderService(db, c.env.DB);
  const order = await service.trackOrder(orderNumber, phone);
  return c.json({ success: true, order });
});

export default ordersRoutes;
