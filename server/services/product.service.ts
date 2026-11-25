import type { AppDb } from '../db';
import { ProductRepository } from '../repositories/product.repository';
import { AppError } from '../middlewares/error';
import type { CreateProductInput, ProductDTO, UpdateProductInput } from '@shared/schemas/product.schema';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class ProductService {
  private repo: ProductRepository;

  constructor(db: AppDb) {
    this.repo = new ProductRepository(db);
  }

  async listProducts(filters: {
    category?: string;
    search?: string;
    sort?: string;
    inStock?: boolean;
    includeInactive?: boolean;
  }): Promise<ProductDTO[]> {
    return this.repo.findAll(filters);
  }

  async getProductBySlug(slug: string): Promise<ProductDTO> {
    const product = await this.repo.findBySlug(slug);
    if (!product) {
      throw new AppError(`Product "${slug}" not found`, 404);
    }
    return product;
  }

  async createProduct(input: CreateProductInput): Promise<ProductDTO> {
    const baseSlug = input.slug ? slugify(input.slug) : slugify(input.name);
    let uniqueSlug = baseSlug || `bag-${Date.now()}`;
    const existing = await this.repo.findBySlug(uniqueSlug);
    if (existing) {
      uniqueSlug = `${uniqueSlug}-${Date.now().toString().slice(-4)}`;
    }

    return this.repo.create({
      ...input,
      slug: uniqueSlug,
    });
  }

  async updateProduct(id: number, input: UpdateProductInput): Promise<ProductDTO> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError(`Product #${id} not found`, 404);
    }

    const updated = await this.repo.update(id, input);
    if (!updated) {
      throw new AppError(`Failed to update product #${id}`, 500);
    }
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    const ok = await this.repo.delete(id);
    if (!ok) {
      throw new AppError(`Product #${id} not found`, 404);
    }
  }
}
