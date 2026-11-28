import { Hono } from 'hono';
import type { Env } from './types';
import { errorHandler } from './middlewares/error';
import storeRoutes from './routes/store.routes';
import productsRoutes from './routes/products.routes';
import ordersRoutes from './routes/orders.routes';
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import { MediaService } from './services/media.service';

const app = new Hono<{ Bindings: Env }>();

app.onError(errorHandler);

app.get('/api/health', (c) => {
  return c.json({ success: true, service: 'Bright Buy Stage 1 Worker', status: 'ok' });
});

// Serve R2 uploaded product images when using Worker /api/media/* proxy
app.get('/api/media/*', async (c) => {
  const key = c.req.path.replace(/^\/api\/media\//, '');
  if (!key) return c.notFound();
  const mediaService = new MediaService(c.env.IMAGES_BUCKET);
  const object = await mediaService.getImage(key);
  if (!object) return c.notFound();

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  if (!headers.has('cache-control')) {
    headers.set('cache-control', 'public, max-age=31536000, immutable');
  }
  return new Response(object.body, { headers });
});

app.route('/api', storeRoutes);
app.route('/api/auth', authRoutes);
app.route('/api/products', productsRoutes);
app.route('/api/orders', ordersRoutes);
app.route('/api/admin', adminRoutes);

export default app;
