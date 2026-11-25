import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Minus, Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { formatLKR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const addItem = useCartStore((s) => s.addItem);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.getProductBySlug(slug || ''),
    enabled: Boolean(slug),
  });

  const product = data?.product;
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedImage(0);
    setQuantity(1);
  }, [slug]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl text-[#1C1917]">Piece Not Found</h1>
        <p className="mt-2 text-sm text-[#78716C]">
          The bag you are looking for may have been archived.
        </p>
        <Link to="/products" className="mt-6 inline-block">
          <Button variant="outline">Return to Collection</Button>
        </Link>
      </div>
    );
  }

  const isSoldOut = product.stockQty <= 0;
  const images = product.images.length > 0 ? product.images : [''];

  const handleAdd = () => {
    addItem(product, quantity);
    toast.success(`${product.name} added to your bag`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 pb-28 md:pb-16">
      <Link
        to="/products"
        className="mb-8 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#78716C] hover:text-[#1C1917]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Collection
      </Link>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Editorial Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/5] w-full overflow-hidden rounded-sm border border-[#E7E5E4] bg-white">
            <img
              src={images[selectedImage] || images[0]}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <button
                  key={`${img}-${idx}`}
                  type="button"
                  onClick={() => setSelectedImage(idx)}
                  className={`aspect-[4/5] overflow-hidden rounded-sm border cursor-pointer ${
                    selectedImage === idx
                      ? 'border-[#1C1917] ring-1 ring-[#1C1917]'
                      : 'border-[#E7E5E4] opacity-75 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-[#78716C]">
                {product.category}
              </span>
              {isSoldOut ? (
                <Badge variant="destructive">Sold Out</Badge>
              ) : product.stockQty <= 5 ? (
                <Badge variant="preorder">Only {product.stockQty} Left</Badge>
              ) : (
                <Badge variant="secondary">In Stock</Badge>
              )}
            </div>

            <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-medium text-[#1C1917]">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3 tabular-nums">
              <span className="text-2xl font-medium text-[#1C1917]">
                {formatLKR(product.priceLkr)}
              </span>
              {product.compareAtPriceLkr && product.compareAtPriceLkr > product.priceLkr && (
                <span className="text-sm text-[#78716C] line-through">
                  {formatLKR(product.compareAtPriceLkr)}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[#78716C]">{product.description}</p>

          {/* Quantity & Desktop Add to Cart */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-wider text-[#78716C]">Quantity</span>
              <div className="flex items-center border border-[#E7E5E4] bg-white rounded-sm">
                <button
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="px-4 text-sm font-medium tabular-nums">{quantity}</span>
                <button
                  type="button"
                  disabled={isSoldOut}
                  onClick={() => setQuantity((q) => Math.min(product.stockQty, q + 1))}
                  className="p-2.5 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={isSoldOut}
              onClick={handleAdd}
            >
              {isSoldOut ? 'Sold Out' : `Add to Bag • ${formatLKR(product.priceLkr * quantity)}`}
            </Button>
          </div>

          <Separator />

          {/* Craftsmanship & Dimension Specs */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#1C1917]">
              Craftsmanship & Specifications
            </h3>
            <dl className="divide-y divide-[#E7E5E4] text-sm">
              {product.specs.material && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-[#78716C]">Material</dt>
                  <dd className="font-medium text-[#1C1917]">{product.specs.material}</dd>
                </div>
              )}
              {product.specs.dimensions && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-[#78716C]">Dimensions</dt>
                  <dd className="font-medium text-[#1C1917]">{product.specs.dimensions}</dd>
                </div>
              )}
              {product.specs.weight && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-[#78716C]">Weight</dt>
                  <dd className="font-medium text-[#1C1917]">{product.specs.weight}</dd>
                </div>
              )}
              {product.specs.warranty && (
                <div className="flex justify-between py-2.5">
                  <dt className="text-[#78716C]">Warranty</dt>
                  <dd className="font-medium text-[#1C1917]">{product.specs.warranty}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="flex items-center gap-2.5 rounded-sm border border-[#E7E5E4] bg-white p-3.5 text-xs text-[#78716C]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#92400E]" />
            <span>Islandwide Cash on Delivery • Complimentary shipping over Rs. 15,000</span>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Add to Cart Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#E7E5E4] bg-white p-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#78716C] truncate max-w-[160px]">{product.name}</p>
            <p className="text-sm font-semibold tabular-nums">
              {formatLKR(product.priceLkr * quantity)}
            </p>
          </div>
          <Button disabled={isSoldOut} onClick={handleAdd} className="shrink-0">
            {isSoldOut ? 'Sold Out' : 'Add to Bag'}
          </Button>
        </div>
      </div>
    </div>
  );
}
