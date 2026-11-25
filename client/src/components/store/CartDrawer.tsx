import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatLKR } from '@/lib/utils';

export function CartDrawer() {
  const navigate = useNavigate();
  const { items, isOpen, closeCart, updateQuantity, removeItem } = useCartStore();

  const subtotal = items.reduce((sum, i) => sum + i.priceLkr * i.quantity, 0);

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && closeCart()}
      title="Your Bag"
      description={`${items.reduce((s, i) => s + i.quantity, 0)} item(s) selected`}
    >
      {items.length === 0 ? (
        <div className="flex h-[60vh] flex-col items-center justify-center text-center">
          <ShoppingBag className="h-10 w-10 stroke-[1.25] text-[#78716C]/50 mb-4" />
          <p className="font-serif text-xl text-[#1C1917]">Your shopping bag is empty</p>
          <p className="mt-1 text-xs text-[#78716C] max-w-xs">
            Explore our handcrafted leather handbags, totes, and travel pieces.
          </p>
          <Button
            className="mt-6"
            onClick={() => {
              closeCart();
              navigate('/products');
            }}
          >
            Explore Collection
          </Button>
        </div>
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex-1 space-y-5">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-24 w-20 shrink-0 rounded-sm border border-[#E7E5E4] object-cover"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#78716C]">
                      {item.category}
                    </p>
                    <h4 className="font-serif text-base font-medium text-[#1C1917]">
                      {item.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center border border-[#E7E5E4] rounded-sm">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-2.5 text-xs font-medium tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {formatLKR(item.priceLkr * item.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="text-[#78716C] hover:text-red-700 cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6">
            <Separator className="mb-4" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#78716C]">Subtotal</span>
              <span className="font-medium text-base tabular-nums">{formatLKR(subtotal)}</span>
            </div>
            <p className="mt-1 text-[11px] text-[#78716C]">
              Complimentary islandwide shipping on orders above Rs. 15,000.
            </p>
            <Button
              size="lg"
              className="mt-5 w-full"
              onClick={() => {
                closeCart();
                navigate('/checkout');
              }}
            >
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
