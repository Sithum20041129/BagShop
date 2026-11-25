import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { CreateOrderSchema, type OrderDTO } from '@shared/schemas/order.schema';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatLKR } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const { data: storeData } = useQuery({
    queryKey: ['store-status'],
    queryFn: api.getStoreStatus,
  });

  const settings = storeData?.settings;
  const isClosed = settings ? !settings.isOpen : false;
  const baseShipping = settings?.shippingFeeLkr ?? 650;

  const subtotal = items.reduce((sum, i) => sum + i.priceLkr * i.quantity, 0);
  const shipping = subtotal >= 15000 ? 0 : baseShipping;
  const total = subtotal + shipping;

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    city: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderDTO | null>(null);

  if (completedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-sm border border-[#E7E5E4] bg-white p-8 text-center space-y-4">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
          <div className="flex justify-center gap-2">
            <Badge variant="success">Order Received</Badge>
            {completedOrder.isPreorder && <Badge variant="preorder">Pre-Order</Badge>}
          </div>
          <h1 className="font-serif text-3xl font-medium text-[#1C1917]">
            Thank You, {completedOrder.customerName}
          </h1>
          <p className="text-sm text-[#78716C]">
            Your reference number is{' '}
            <strong className="text-[#1C1917]">{completedOrder.orderNumber}</strong>.
            {completedOrder.isPreorder
              ? ' Because the store is currently closed, your order is queued as a Pre-Order and will be confirmed once we reopen.'
              : ' Our team will confirm your order shortly.'}
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              to={`/track?order=${encodeURIComponent(completedOrder.orderNumber)}&phone=${encodeURIComponent(completedOrder.customerPhone)}`}
            >
              <Button>Track This Order</Button>
            </Link>
            <Link to="/products">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-[#1C1917]">Your Bag is Empty</h1>
        <p className="mt-2 text-sm text-[#78716C]">
          Add a piece from our collection before proceeding to checkout.
        </p>
        <Link to="/products" className="mt-6 inline-block">
          <Button>Browse Collection</Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const payload = {
      ...form,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };

    const parsed = CreateOrderSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] || 'form');
        nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createOrder(parsed.data);
      clearCart();
      setCompletedOrder(res.order);
      toast.success(
        res.order.isPreorder ? 'Pre-order placed successfully!' : 'Order placed successfully!'
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[#E7E5E4] pb-6 mb-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#78716C]">Bright Buy</p>
        <h1 className="mt-1 font-serif text-4xl font-medium text-[#1C1917]">
          {isClosed ? 'Pre-Order Checkout' : 'Checkout'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Left: Delivery Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-sm border border-[#E7E5E4] bg-white p-6 space-y-5">
            <h2 className="font-serif text-2xl font-medium text-[#1C1917]">Delivery Details</h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="customerName">Full Name *</Label>
                <Input
                  id="customerName"
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Nimali Perera"
                />
                {errors.customerName && (
                  <p className="mt-1 text-xs text-red-700">{errors.customerName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="077 123 4567"
                />
                {errors.customerPhone && (
                  <p className="mt-1 text-xs text-red-700">{errors.customerPhone}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="customerEmail">Email (Optional)</Label>
              <Input
                id="customerEmail"
                type="email"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                placeholder="you@example.com"
              />
              {errors.customerEmail && (
                <p className="mt-1 text-xs text-red-700">{errors.customerEmail}</p>
              )}
            </div>

            <div>
              <Label htmlFor="shippingAddress">Street Address *</Label>
              <Input
                id="shippingAddress"
                value={form.shippingAddress}
                onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })}
                placeholder="No. 42, Ward Place"
              />
              {errors.shippingAddress && (
                <p className="mt-1 text-xs text-red-700">{errors.shippingAddress}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Colombo 07"
              />
              {errors.city && <p className="mt-1 text-xs text-red-700">{errors.city}</p>}
            </div>

            <div>
              <Label htmlFor="notes">Delivery Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Preferred delivery window or gate instructions..."
              />
            </div>
          </div>
        </div>

        {/* Right: Sticky Summary + Pre-Order Notice */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-5">
            {isClosed && (
              <div className="rounded-sm border border-[#92400E]/30 bg-[#92400E]/5 p-4 flex gap-3">
                <Clock className="h-5 w-5 shrink-0 text-[#92400E] mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#92400E]">
                    Pre-Order Notice
                  </p>
                  <p className="text-xs leading-relaxed text-[#1C1917]">
                    {settings?.closedMessage}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-sm border border-[#E7E5E4] bg-white p-6 space-y-5">
              <h2 className="font-serif text-2xl font-medium text-[#1C1917]">Order Summary</h2>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-14 w-11 rounded-sm border border-[#E7E5E4] object-cover"
                      />
                      <div>
                        <p className="font-medium text-[#1C1917]">{item.name}</p>
                        <p className="text-xs text-[#78716C] tabular-nums">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium tabular-nums">
                      {formatLKR(item.priceLkr * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm tabular-nums">
                <div className="flex justify-between text-[#78716C]">
                  <span>Subtotal</span>
                  <span>{formatLKR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#78716C]">
                  <span>Islandwide Shipping</span>
                  <span>{shipping === 0 ? 'Complimentary' : formatLKR(shipping)}</span>
                </div>
                <div className="flex justify-between pt-2 text-base font-semibold text-[#1C1917]">
                  <span>Total (Cash on Delivery)</span>
                  <span>{formatLKR(total)}</span>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting
                  ? 'Submitting...'
                  : isClosed
                    ? 'Place Pre-Order'
                    : 'Place Order'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
