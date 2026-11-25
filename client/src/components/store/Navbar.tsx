import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useCartStore } from '@/store/cart.store';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { items, openCart } = useCartStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-xs uppercase tracking-[0.16em] transition-colors',
      isActive ? 'text-[#1C1917] font-semibold' : 'text-[#78716C] hover:text-[#1C1917]'
    );

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E5E4] bg-[#FAFAF9]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left Nav (Desktop) */}
        <nav className="hidden md:flex items-center gap-7">
          <NavLink to="/products" className={linkClass}>
            Collection
          </NavLink>
          <NavLink to="/track" className={linkClass}>
            Track Order
          </NavLink>
        </nav>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          className="md:hidden p-1.5 text-[#1C1917] cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Centered Brand Wordmark */}
        <Link
          to="/"
          className="font-serif text-2xl font-semibold tracking-[0.18em] uppercase text-[#1C1917]"
        >
          Bright Buy
        </Link>

        {/* Right Nav */}
        <div className="flex items-center gap-6">
          <NavLink to="/admin" className={cn(linkClass({ isActive: false }), 'hidden md:inline')}>
            Admin
          </NavLink>
          <button
            type="button"
            onClick={openCart}
            className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-[#1C1917] hover:text-[#92400E] transition-colors cursor-pointer"
            aria-label="Open shopping bag"
          >
            <ShoppingBag className="h-4 w-4 stroke-[1.75]" />
            <span className="hidden sm:inline">Bag</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-[#1C1917] px-1.5 text-[10px] font-medium text-white tabular-nums">
              {totalCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E7E5E4] bg-white px-6 py-4 space-y-3">
          <Link
            to="/products"
            onClick={() => setMobileOpen(false)}
            className="block text-xs uppercase tracking-widest text-[#1C1917] py-1.5"
          >
            Collection
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileOpen(false)}
            className="block text-xs uppercase tracking-widest text-[#1C1917] py-1.5"
          >
            Track Order
          </Link>
          <Link
            to="/admin"
            onClick={() => setMobileOpen(false)}
            className="block text-xs uppercase tracking-widest text-[#78716C] py-1.5"
          >
            Admin Portal
          </Link>
        </div>
      )}
    </header>
  );
}
