import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/store/ProductCard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  'All',
  'Handbags',
  'Tote Bags',
  'Backpacks',
  'Travel Bags',
  'Wallets & Clutches',
  "Men's Collection",
];

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';

  const [category, setCategory] = useState(initialCat);
  const [search, setSearch] = useState(initialSearch);
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    setCategory(searchParams.get('category') || 'All');
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', category, search, sort, inStockOnly],
    queryFn: () =>
      api.getProducts({
        category,
        search: search.trim() || undefined,
        sort,
        inStock: inStockOnly,
      }),
  });

  const handleCategoryChange = (next: string) => {
    setCategory(next);
    if (next === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', next);
    }
    setSearchParams(searchParams);
  };

  const products = data?.products || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[#E7E5E4] pb-8">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#78716C]">Bright Buy</p>
        <h1 className="mt-1 font-serif text-4xl font-medium text-[#1C1917]">The Collection</h1>
      </div>

      {/* Minimal Filter & Sort Bar */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={cn(
                'rounded-sm px-3.5 py-1.5 text-xs uppercase tracking-wider transition-colors cursor-pointer border',
                category === cat
                  ? 'border-[#1C1917] bg-[#1C1917] text-white'
                  : 'border-[#E7E5E4] bg-white text-[#78716C] hover:border-[#1C1917] hover:text-[#1C1917]'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#78716C]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bags..."
              className="h-9 pl-8 text-xs"
            />
          </div>

          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 w-44 text-xs"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </Select>

          <label className="flex items-center gap-2 text-xs text-[#78716C] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="accent-[#1C1917]"
            />
            In Stock Only
          </label>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mt-10">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="space-y-3">
                <Skeleton className="aspect-[4/5] w-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-sm border border-[#E7E5E4] bg-white py-20 text-center">
            <p className="font-serif text-2xl text-[#1C1917]">No pieces match your selection</p>
            <p className="mt-1 text-xs text-[#78716C]">
              Try clearing your search or selecting another category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
