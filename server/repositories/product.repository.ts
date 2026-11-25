import { eq, desc, asc, and, gt, like, or } from 'drizzle-orm';
import type { AppDb } from '../db';
import { products } from '../db/schema';
import type { CreateProductInput, ProductDTO, ProductSpecs, UpdateProductInput } from '@shared/schemas/product.schema';

function mapProductRow(row: typeof products.$inferSelect): ProductDTO {
  let images: string[] = [];
  let specs: ProductSpecs = {};
  try {
    images = JSON.parse(row.imagesJson || '[]');
  } catch {
    images = [];
  }
  try {
    specs = JSON.parse(row.specsJson || '{}');
  } catch {
    specs = {};
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.category,
    priceLkr: row.priceLkr,
    compareAtPriceLkr: row.compareAtPriceLkr,
    stockQty: row.stockQty,
    images,
    specs,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ProductRepository {
  constructor(private db: AppDb) {}

  async findAll(filters: {
    category?: string;
    search?: string;
    sort?: string;
    inStock?: boolean;
    includeInactive?: boolean;
  }): Promise<ProductDTO[]> {
    const conditions = [];

    if (!filters.includeInactive) {
      conditions.push(eq(products.isActive, true));
    }
    if (filters.category && filters.category !== 'All') {
      conditions.push(eq(products.category, filters.category));
    }
    if (filters.inStock) {
      conditions.push(gt(products.stockQty, 0));
    }
    if (filters.search) {
      const pattern = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          like(products.name, pattern),
          like(products.description, pattern),
          like(products.category, pattern)
        )
      );
    }

    const orderBy =
      filters.sort === 'price_asc'
        ? asc(products.priceLkr)
        : filters.sort === 'price_desc'
          ? desc(products.priceLkr)
          : desc(products.createdAt);

    const rows = await this.db
      .select()
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderBy);

    return rows.map(mapProductRow);
  }

  async findBySlug(slug: string): Promise<ProductDTO | null> {
    const rows = await this.db
      .select()
      .from(products)
      .where(eq(products.slug, slug))
      .limit(1);
    return rows[0] ? mapProductRow(rows[0]) : null;
  }

  async findById(id: number): Promise<ProductDTO | null> {
    const rows = await this.db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    return rows[0] ? mapProductRow(rows[0]) : null;
  }

  async create(input: CreateProductInput & { slug: string }): Promise<ProductDTO> {
    const now = new Date().toISOString();
    const rows = await this.db
      .insert(products)
      .values({
        slug: input.slug,
        name: input.name,
        description: input.description,
        category: input.category,
        priceLkr: input.priceLkr,
        compareAtPriceLkr: input.compareAtPriceLkr ?? null,
        stockQty: input.stockQty,
        imagesJson: JSON.stringify(input.images),
        specsJson: JSON.stringify(input.specs || {}),
        isActive: input.isActive,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return mapProductRow(rows[0]);
  }

  async update(id: number, input: UpdateProductInput): Promise<ProductDTO | null> {
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (input.name !== undefined) updateValues.name = input.name;
    if (input.slug !== undefined) updateValues.slug = input.slug;
    if (input.description !== undefined) updateValues.description = input.description;
    if (input.category !== undefined) updateValues.category = input.category;
    if (input.priceLkr !== undefined) updateValues.priceLkr = input.priceLkr;
    if (input.compareAtPriceLkr !== undefined) updateValues.compareAtPriceLkr = input.compareAtPriceLkr;
    if (input.stockQty !== undefined) updateValues.stockQty = input.stockQty;
    if (input.images !== undefined) updateValues.imagesJson = JSON.stringify(input.images);
    if (input.specs !== undefined) updateValues.specsJson = JSON.stringify(input.specs);
    if (input.isActive !== undefined) updateValues.isActive = input.isActive;

    const rows = await this.db
      .update(products)
      .set(updateValues)
      .where(eq(products.id, id))
      .returning();

    return rows[0] ? mapProductRow(rows[0]) : null;
  }

  async delete(id: number): Promise<boolean> {
    // Soft-delete if referenced by order_items, otherwise hard delete
    try {
      const deleted = await this.db.delete(products).where(eq(products.id, id)).returning();
      return deleted.length > 0;
    } catch {
      const updated = await this.db
        .update(products)
        .set({ isActive: false, updatedAt: new Date().toISOString() })
        .where(eq(products.id, id))
        .returning();
      return updated.length > 0;
    }
  }
}
