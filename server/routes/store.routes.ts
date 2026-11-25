import { Hono } from 'hono';
import type { Env } from '../types';
import { createDb } from '../db';
import { StoreService } from '../services/store.service';
import { parseJsonBody } from '../middlewares/validate';
import { NewsletterSchema } from '@shared/schemas/store.schema';

const storeRoutes = new Hono<{ Bindings: Env }>();

storeRoutes.get('/store/status', async (c) => {
  const db = createDb(c.env.DB);
  const service = new StoreService(db);
  const settings = await service.getStatus();
  return c.json({ success: true, settings });
});

storeRoutes.post('/newsletter', async (c) => {
  const body = await parseJsonBody(c, NewsletterSchema);
  const db = createDb(c.env.DB);
  const service = new StoreService(db);
  const result = await service.subscribeNewsletter(body.email);
  return c.json({ success: true, ...result });
});

export default storeRoutes;
