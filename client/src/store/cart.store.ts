import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ProductDTO } from '@shared/schemas/product.schema';

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  category: string;
  priceLkr: number;
  image: string;
  stockQty: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: ProductDTO, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find((i) => i.productId === product.id);
        const maxStock = Math.max(1, product.stockQty);

        if (existing) {
          const nextQty = Math.min(maxStock, existing.quantity + quantity);
          set({
            items: items.map((i) =>
              i.productId === product.id ? { ...i, quantity: nextQty, stockQty: product.stockQty } : i
            ),
            isOpen: true,
          });
        } else {
          set({
            items: [
              ...items,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                category: product.category,
                priceLkr: product.priceLkr,
                image: product.images[0] || '',
                stockQty: product.stockQty,
                quantity: Math.min(maxStock, quantity),
              },
            ],
            isOpen: true,
          });
        }
      },
      removeItem: (productId) =>
        set({ items: get().items.filter((i) => i.productId !== productId) }),
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.productId !== productId) });
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(Math.max(1, i.stockQty), quantity) }
              : i
          ),
        });
      },
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'brightbuy_stage1_cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
