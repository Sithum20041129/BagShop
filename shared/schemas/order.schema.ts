import { z } from 'zod';

export const OrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const OrderItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(20),
});

export const CreateOrderSchema = z.object({
  customerName: z.string().trim().min(2, 'Full name is required'),
  customerPhone: z
    .string()
    .trim()
    .min(7, 'Valid phone number is required')
    .max(20, 'Phone number is too long'),
  customerEmail: z
    .string()
    .trim()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  shippingAddress: z.string().trim().min(5, 'Shipping address is required'),
  city: z.string().trim().min(2, 'City is required'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  items: z.array(OrderItemInputSchema).min(1, 'Cart cannot be empty'),
});

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
  trackingCode: z.string().trim().max(100).optional().nullable(),
});

export const TrackOrderQuerySchema = z.object({
  phone: z.string().trim().min(4, 'Phone number is required for verification'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

export interface OrderItemDTO {
  id: number;
  orderId: number;
  productId: number;
  productNameSnapshot: string;
  unitPriceLkr: number;
  quantity: number;
}

export interface OrderDTO {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: string;
  city: string;
  notes: string | null;
  status: OrderStatus;
  isPreorder: boolean;
  subtotalLkr: number;
  shippingLkr: number;
  totalLkr: number;
  trackingCode: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDTO[];
}
