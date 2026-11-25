import type { AppDb } from '../db';
import { OrderRepository } from '../repositories/order.repository';
import { ProductRepository } from '../repositories/product.repository';
import { StoreRepository } from '../repositories/store.repository';
import { AppError } from '../middlewares/error';
import type {
  CreateOrderInput,
  OrderDTO,
  OrderStatus,
} from '@shared/schemas/order.schema';

export class OrderService {
  private orderRepo: OrderRepository;
  private productRepo: ProductRepository;
  private storeRepo: StoreRepository;

  constructor(private db: AppDb, private d1: D1Database) {
    this.orderRepo = new OrderRepository(db);
    this.productRepo = new ProductRepository(db);
    this.storeRepo = new StoreRepository(db);
  }

  async createOrder(input: CreateOrderInput): Promise<OrderDTO> {
    const settings = await this.storeRepo.getSettings();
    const isPreorder = !settings.isOpen;

    let subtotalLkr = 0;
    const verifiedItems: {
      productId: number;
      productNameSnapshot: string;
      unitPriceLkr: number;
      quantity: number;
    }[] = [];

    for (const item of input.items) {
      const product = await this.productRepo.findById(item.productId);
      if (!product || !product.isActive) {
        throw new AppError(`Product #${item.productId} is no longer available`, 400);
      }
      if (product.stockQty < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${product.name}". Available: ${product.stockQty}`,
          400
        );
      }

      subtotalLkr += product.priceLkr * item.quantity;
      verifiedItems.push({
        productId: product.id,
        productNameSnapshot: product.name,
        unitPriceLkr: product.priceLkr,
        quantity: item.quantity,
      });
    }

    // Free shipping for orders Rs. 15,000+ or use configured shippingFeeLkr
    const shippingLkr = subtotalLkr >= 15000 ? 0 : settings.shippingFeeLkr;
    const totalLkr = subtotalLkr + shippingLkr;

    const orderNumber = `BG-${Math.floor(1000 + Math.random() * 9000)}-${Date.now()
      .toString()
      .slice(-3)}`;
    const now = new Date().toISOString();

    const statements: D1PreparedStatement[] = [
      this.d1
        .prepare(
          `INSERT INTO orders (
            order_number, customer_name, customer_phone, customer_email,
            shipping_address, city, notes, status, is_preorder,
            subtotal_lkr, shipping_lkr, total_lkr, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          orderNumber,
          input.customerName,
          input.customerPhone,
          input.customerEmail || null,
          input.shippingAddress,
          input.city,
          input.notes || null,
          isPreorder ? 1 : 0,
          subtotalLkr,
          shippingLkr,
          totalLkr,
          now,
          now
        ),
      ...verifiedItems.map((vi) =>
        this.d1
          .prepare(
            `INSERT INTO order_items (
              order_id, product_id, product_name_snapshot, unit_price_lkr, quantity
            ) VALUES ((SELECT id FROM orders WHERE order_number = ?), ?, ?, ?, ?)`
          )
          .bind(orderNumber, vi.productId, vi.productNameSnapshot, vi.unitPriceLkr, vi.quantity)
      ),
      ...verifiedItems.map((vi) =>
        this.d1
          .prepare(
            `UPDATE products
             SET stock_qty = stock_qty - ?, updated_at = ?
             WHERE id = ? AND stock_qty >= ?`
          )
          .bind(vi.quantity, now, vi.productId, vi.quantity)
      ),
    ];

    await this.d1.batch(statements);

    const created = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!created) {
      throw new AppError('Order creation failed', 500);
    }
    return created;
  }

  async trackOrder(orderNumber: string, phone: string): Promise<OrderDTO> {
    const order = await this.orderRepo.findByOrderNumber(orderNumber);
    if (!order) {
      throw new AppError(`No order found with number "${orderNumber}"`, 404);
    }

    const normalizePhone = (p: string) => p.replace(/\D/g, '').slice(-9);
    if (normalizePhone(order.customerPhone) !== normalizePhone(phone)) {
      throw new AppError('Phone number does not match this order', 403);
    }

    return order;
  }

  async listOrders(filters: { status?: string; preorder?: boolean }): Promise<OrderDTO[]> {
    return this.orderRepo.findAll(filters);
  }

  async updateOrderStatus(
    id: number,
    status: OrderStatus,
    trackingCode?: string | null
  ): Promise<OrderDTO> {
    const updated = await this.orderRepo.updateStatus(id, status, trackingCode);
    if (!updated) {
      throw new AppError(`Order #${id} not found`, 404);
    }
    return updated;
  }
}
