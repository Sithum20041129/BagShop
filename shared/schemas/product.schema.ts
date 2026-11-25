import { z } from 'zod';

export const ProductColorSchema = z.object({
  name: z.string().min(1),
  hex: z.string().min(1),
});

export const ProductSpecsSchema = z.object({
  material: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  capacity: z.string().optional(),
  warranty: z.string().optional(),
  colors: z.array(ProductColorSchema).optional(),
  features: z.array(z.string()).optional(),
});

export const CreateProductSchema = z.object({
  name: z.string().trim().min(2, 'Product name must be at least 2 characters'),
  slug: z.string().trim().optional(),
  description: z.string().trim().min(5, 'Description is required'),
  category: z.string().trim().min(1, 'Category is required'),
  priceLkr: z.coerce.number().int().min(100, 'Price must be at least Rs. 100'),
  compareAtPriceLkr: z.coerce.number().int().positive().nullable().optional(),
  stockQty: z.coerce.number().int().min(0, 'Stock cannot be negative').default(10),
  images: z.array(z.string().min(1)).min(1, 'At least one product image is required'),
  specs: ProductSpecsSchema.default({}),
  isActive: z.boolean().default(true),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductFilterSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional(),
  inStock: z.enum(['true', 'false']).optional(),
});

export type ProductColor = z.infer<typeof ProductColorSchema>;
export type ProductSpecs = z.infer<typeof ProductSpecsSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;

export interface ProductDTO {
  id: number;
  slug: string;
  name: string;
  description: string;
  category: string;
  priceLkr: number;
  compareAtPriceLkr: number | null;
  stockQty: number;
  images: string[];
  specs: ProductSpecs;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
