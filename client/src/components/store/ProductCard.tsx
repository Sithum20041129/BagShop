import { Link } from 'react-router-dom';
import type { ProductDTO } from '@shared/schemas/product.schema';
import { formatLKR } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function ProductCard({ product }: { product: ProductDTO }) {
  const primaryImage = product.images[0] || '';
  const secondaryImage = product.images[1] || primaryImage;
  const isSoldOut = product.stockQty <= 0;
  const isLowStock = product.stockQty > 0 && product.stockQty <= 5;

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-[#E7E5E4] bg-white">
        <img
          src={primaryImage}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.03]"
        />
        {secondaryImage !== primaryImage && (
          <img
            src={secondaryImage}
            alt={`${product.name} alternate view`}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
          {isLowStock && <Badge variant="preorder">Low Stock</Badge>}
        </div>
      </div>

      <div className="mt-3.5 space-y-1">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#78716C]">
          {product.category}
        </p>
        <h3 className="font-serif text-lg font-medium leading-snug text-[#1C1917] group-hover:text-[#92400E] transition-colors">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2 pt-0.5 tabular-nums">
          <span className="text-sm font-medium text-[#1C1917]">
            {formatLKR(product.priceLkr)}
          </span>
          {product.compareAtPriceLkr && product.compareAtPriceLkr > product.priceLkr && (
            <span className="text-xs text-[#78716C] line-through">
              {formatLKR(product.compareAtPriceLkr)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
