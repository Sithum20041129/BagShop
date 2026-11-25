import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { OrderDTO } from '@shared/schemas/order.schema';
import { api } from '@/lib/api';
import { formatLKR } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { OrderStepper } from '@/components/store/OrderStepper';

export function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [phone, setPhone] = useState(searchParams.get('phone') || '');
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const performLookup = async (num: string, ph: string) => {
    if (!num.trim() || !ph.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.trackOrder(num.trim(), ph.trim());
      setOrder(res.order);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Unable to locate order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const qOrder = searchParams.get('order');
    const qPhone = searchParams.get('phone');
    if (qOrder && qPhone) {
      void performLookup(qOrder, qPhone);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void performLookup(orderNumber, phone);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[#E7E5E4] pb-6 mb-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#78716C]">Client Care</p>
        <h1 className="mt-1 font-serif text-4xl font-medium text-[#1C1917]">Track Your Order</h1>
        <p className="mt-2 text-sm text-[#78716C]">
          Enter your order reference and phone number to view live fulfillment progress.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-sm border border-[#E7E5E4] bg-white p-6 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end"
      >
        <div>
          <Label htmlFor="track-order-number">Order Number</Label>
          <Input
            id="track-order-number"
            required
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. BB-2026-4421"
          />
        </div>
        <div>
          <Label htmlFor="track-phone">Phone Number</Label>
          <Input
            id="track-phone"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="077 123 4567"
          />
        </div>
        <Button type="submit" disabled={loading} className="h-10">
          <Search className="h-4 w-4" />
          {loading ? 'Searching...' : 'Track Order'}
        </Button>
      </form>

      {error && (
        <div className="mt-6 rounded-sm border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {order && (
        <div className="mt-8 rounded-sm border border-[#E7E5E4] bg-white p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-serif text-2xl font-medium text-[#1C1917]">
                  {order.orderNumber}
                </h2>
                {order.isPreorder && <Badge variant="preorder">Pre-Order</Badge>}
              </div>
              <p className="text-xs text-[#78716C] mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-LK', { dateStyle: 'long' })}
              </p>
            </div>
            <div className="text-right tabular-nums">
              <p className="text-xs text-[#78716C]">Total Amount</p>
              <p className="text-lg font-semibold text-[#1C1917]">{formatLKR(order.totalLkr)}</p>
            </div>
          </div>

          <OrderStepper status={order.status} />

          {order.trackingCode && (
            <div className="rounded-sm bg-[#FAFAF9] border border-[#E7E5E4] px-4 py-3 text-xs">
              <span className="text-[#78716C] uppercase tracking-wider mr-2">Courier Tracking:</span>
              <strong className="text-[#1C1917]">{order.trackingCode}</strong>
            </div>
          )}

          <Separator />

          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#78716C]">
              Items Ordered
            </p>
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm tabular-nums">
                <span>
                  {item.productNameSnapshot} × {item.quantity}
                </span>
                <span className="font-medium">
                  {formatLKR(item.unitPriceLkr * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
