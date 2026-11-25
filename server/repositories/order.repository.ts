import { eq, desc, and, inArray } from 'drizzle-orm';
import type { AppDb } from '../db';
import { orders, orderItems } from '../db/schema';
import type { OrderDTO, OrderItemDTO, OrderStatus } from '@shared/schemas/order.schema';

function mapOrderRow(
  order: typeof orders.$inferSelect,
  items: (typeof orderItems.$inferSelect)[]
): OrderDTO {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerEmail: order.customerEmail,
    shippingAddress: order.shippingAddress,
    city: order.city,
    notes: order.notes,
    status: order.status as OrderStatus,
    isPreorder: order.isPreorder,
    subtotalLkr: order.subtotalLkr,
    shippingLkr: order.shippingLkr,
    totalLkr: order.totalLkr,
    trackingCode: order.trackingCode,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    items: items.map(
      (i): OrderItemDTO => ({
        id: i.id,
        orderId: i.orderId,
        productId: i.productId,
        productNameSnapshot: i.productNameSnapshot,
        unitPriceLkr: i.unitPriceLkr,
        quantity: i.quantity,
      })
    ),
  };
}

export class OrderRepository {
  constructor(private db: AppDb) {}

  async findAll(filters: { status?: string; preorder?: boolean }): Promise<OrderDTO[]> {
    const conditions = [];
    if (filters.status && filters.status !== 'ALL') {
      conditions.push(eq(orders.status, filters.status as OrderStatus));
    }
    if (filters.preorder !== undefined) {
      conditions.push(eq(orders.isPreorder, filters.preorder));
    }

    const orderRows = await this.db
      .select()
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt));

    if (orderRows.length === 0) return [];

    const orderIds = orderRows.map((o) => o.id);
    const allItems = await this.db
      .select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    const itemsByOrder = new Map<number, (typeof orderItems.$inferSelect)[]>();
    for (const item of allItems) {
      const list = itemsByOrder.get(item.orderId) || [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    return orderRows.map((o) => mapOrderRow(o, itemsByOrder.get(o.id) || []));
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderDTO | null> {
    const rows = await this.db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber.trim().toUpperCase()))
      .limit(1);

    if (!rows[0]) return null;

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, rows[0].id));

    return mapOrderRow(rows[0], items);
  }

  async findById(id: number): Promise<OrderDTO | null> {
    const rows = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!rows[0]) return null;
    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, rows[0].id));
    return mapOrderRow(rows[0], items);
  }

  async updateStatus(
    id: number,
    status: OrderStatus,
    trackingCode?: string | null
  ): Promise<OrderDTO | null> {
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (trackingCode !== undefined) {
      updateData.trackingCode = trackingCode;
    }

    const rows = await this.db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    if (!rows[0]) return null;

    const items = await this.db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, rows[0].id));

    return mapOrderRow(rows[0], items);
  }
}
