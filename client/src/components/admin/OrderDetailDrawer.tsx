import { useState, useEffect } from 'react';
import { CheckCircle2, Truck } from 'lucide-react';
import type { OrderDTO, OrderStatus } from '@shared/schemas/order.schema';
import { Sheet } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatLKR } from '@/lib/utils';

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PACKING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
];

export function OrderDetailDrawer({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
  updating,
}: {
  order: OrderDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (id: number, status: OrderStatus, trackingCode?: string | null) => Promise<void>;
  updating: boolean;
}) {
  const [status, setStatus] = useState<OrderStatus>('PENDING');
  const [trackingCode, setTrackingCode] = useState('');

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setTrackingCode(order.trackingCode || '');
    }
  }, [order]);

  if (!order) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={order.orderNumber}
      description={`Placed ${new Date(order.createdAt).toLocaleString()}`}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={order.status === 'CANCELLED' ? 'destructive' : 'default'}>
            {order.status}
          </Badge>
          {order.isPreorder && <Badge variant="preorder">Pre-Order</Badge>}
        </div>

        {/* 1-Click Confirm Order for Pending Orders */}
        {order.status === 'PENDING' && (
          <Button
            className="w-full"
            disabled={updating}
            onClick={() => void onUpdateStatus(order.id, 'CONFIRMED', trackingCode || null)}
          >
            <CheckCircle2 className="h-4 w-4" />
            1-Click Confirm Order
          </Button>
        )}

        {/* Customer Details */}
        <div className="rounded-sm border border-[#E7E5E4] bg-[#FAFAF9] p-4 space-y-1.5 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#78716C] mb-2">
            Customer & Delivery
          </p>
          <p className="font-medium text-[#1C1917]">{order.customerName}</p>
          <p className="text-[#78716C]">{order.customerPhone}</p>
          {order.customerEmail && <p className="text-[#78716C]">{order.customerEmail}</p>}
          <p className="text-[#1C1917] pt-1">
            {order.shippingAddress}, {order.city}
          </p>
          {order.notes && (
            <p className="text-xs italic text-[#92400E] pt-1">Note: "{order.notes}"</p>
          )}
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#78716C]">
            Items ({order.items.length})
          </p>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium text-[#1C1917]">{item.productNameSnapshot}</p>
                <p className="text-xs text-[#78716C] tabular-nums">
                  {item.quantity} × {formatLKR(item.unitPriceLkr)}
                </p>
              </div>
              <span className="font-medium tabular-nums">
                {formatLKR(item.unitPriceLkr * item.quantity)}
              </span>
            </div>
          ))}

          <Separator />

          <div className="space-y-1 text-sm tabular-nums">
            <div className="flex justify-between text-[#78716C]">
              <span>Subtotal</span>
              <span>{formatLKR(order.subtotalLkr)}</span>
            </div>
            <div className="flex justify-between text-[#78716C]">
              <span>Shipping</span>
              <span>{order.shippingLkr === 0 ? 'Complimentary' : formatLKR(order.shippingLkr)}</span>
            </div>
            <div className="flex justify-between pt-2 text-base font-semibold text-[#1C1917]">
              <span>Total</span>
              <span>{formatLKR(order.totalLkr)}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Status & Courier Tracking Update */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="order-status-select">Update Order Status</Label>
            <Select
              id="order-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as OrderStatus)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="tracking-code-input">Courier Tracking Code</Label>
            <div className="relative">
              <Input
                id="tracking-code-input"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="e.g. PRONTO-884920"
              />
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={updating}
            onClick={() => void onUpdateStatus(order.id, status, trackingCode.trim() || null)}
          >
            <Truck className="h-4 w-4" />
            Save Status & Tracking
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
