import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/store/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORIES = [
  {
    name: 'Handbags',
    image:
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Tote Bags',
    image:
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Backpacks',
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Travel Bags',
    image:
      'https://images.unsplash.com/photo-1547949003-9792a18a2601?auto=format&fit=crop&w=800&q=80',
  },
];

export function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => api.getProducts({ sort: 'newest' }),
  });

  const featuredProducts = (data?.products || []).slice(0, 4);

  return (
    <div>
      {/* Minimalist Luxury Full-Bleed Hero */}
      <section className="relative overflow-hidden border-b border-[#E7E5E4] bg-[#1C1917] text-white">
        <img
          src="https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1600&q=80"
          alt="Bright Buy Luxury Leather Collection"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="relative mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-end px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="text-xs uppercase tracking-[0.25em] text-[#E7E5E4]">
            Colombo • Islandwide Delivery
          </p>
          <h1 className="mt-3 max-w-2xl font-serif text-4xl font-normal leading-[1.1] sm:text-6xl">
            Architectural Carry, Crafted for Quiet Luxury.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-[#E7E5E4]/90">
            Full-grain leather handbags, structured work totes, and tailored travel pieces
            designed with enduring restraint.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/products">
              <Button size="lg" className="bg-white text-[#1C1917] hover:bg-[#FAFAF9]">
                Explore Collection
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/track">
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                Track an Order
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Curated Silhouettes */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between border-b border-[#E7E5E4] pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#78716C]">Curated</p>
            <h2 className="mt-1 font-serif text-3xl font-medium text-[#1C1917]">
              Signature Arrivals
            </h2>
          </div>
          <Link
            to="/products"
            className="text-xs uppercase tracking-[0.16em] text-[#1C1917] hover:text-[#92400E] flex items-center gap-1.5"
          >
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="space-y-3">
                <Skeleton className="aspect-[4/5] w-full" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Categories Editorial Strip */}
      <section className="border-t border-[#E7E5E4] bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#78716C]">Silhouettes</p>
            <h2 className="mt-1 font-serif text-3xl font-medium text-[#1C1917]">
              Browse by Category
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group relative aspect-[4/5] overflow-hidden rounded-sm border border-[#E7E5E4]"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1C1917]/75 via-transparent to-transparent" />
                <span className="absolute bottom-4 left-4 font-serif text-xl font-medium text-white">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
