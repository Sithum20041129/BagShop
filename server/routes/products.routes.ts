import { Hono } from 'hono';
import type { Env } from '../types';
import { createDb } from '../db';
import { ProductService } from '../services/product.service';

const productsRoutes = new Hono<{ Bindings: Env }>();

productsRoutes.get('/', async (c) => {
  const db = createDb(c.env.DB);
  const service = new ProductService(db);
  const category = c.req.query('category');
  const search = c.req.query('search');
  const sort = c.req.query('sort');
  const inStock = c.req.query('inStock') === 'true';

  const products = await service.listProducts({
    category,
    search,
    sort,
    inStock,
    includeInactive: false,
  });

  return c.json({ success: true, products });
});

productsRoutes.get('/:slug', async (c) => {
  const db = createDb(c.env.DB);
  const service = new ProductService(db);
  const slug = c.req.param('slug');
  const product = await service.getProductBySlug(slug);
  return c.json({ success: true, product });
});

export default productsRoutes;
