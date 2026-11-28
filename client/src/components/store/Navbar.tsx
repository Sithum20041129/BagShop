import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SignInButton, UserButton, useAuth, useUser } from '@clerk/react';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cart.store';
import { cn } from '@/lib/utils';

export function Navbar() {
  const navigate = useNavigate();
  const { items, openCart } = useCartStore();
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Sync Clerk user to D1 and read role (ADMIN vs CUSTOMER)
  const { data: authData } = useQuery({
    queryKey: ['auth-me', userId],
    queryFn: api.getAuthMe,
    enabled: Boolean(isSignedIn && userId),
    staleTime: 60_000,
  });

  const metaRole = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const isAdmin =
    isSignedIn &&
    (authData?.user?.role === 'ADMIN' || metaRole?.toUpperCase() === 'ADMIN');

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-xs uppercase tracking-[0.14em] whitespace-nowrap transition-colors',
      isActive ? 'text-[#1C1917] font-semibold' : 'text-[#78716C] hover:text-[#1C1917]'
    );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E5E4] bg-[#FAFAF9]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Left: Earlier Version Bright Buy Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#1C1917] text-[#D97706] transition-transform group-hover:scale-[1.03]">
            <ShoppingBag className="h-5 w-5 stroke-[1.75]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-sans text-lg font-extrabold tracking-tight text-[#1C1917]">
              BRIGHT<span className="text-[#92400E]">BUY</span>
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.16em] text-[#78716C]">
              BAGS & LEATHER EDITIONS
            </span>
          </div>
        </Link>

        {/* Center: Search Bar (Desktop) */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-xs lg:max-w-sm items-center relative"
        >
          <Search className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#78716C]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search handbags, totes, brands..."
            className="h-9 w-full rounded-sm border border-[#E7E5E4] bg-white pl-9 pr-3 text-xs text-[#1C1917] placeholder:text-[#78716C]/70 focus:border-[#1C1917] focus:outline-none"
          />
        </form>

        {/* Nav Links after Search Bar: Collection, Categories, Brands, Track Order */}
        <nav className="hidden lg:flex items-center gap-6">
          <NavLink to="/products" end className={linkClass}>
            Collection
          </NavLink>
          <a
            href="/#categories"
            className="text-xs uppercase tracking-[0.14em] whitespace-nowrap text-[#78716C] hover:text-[#1C1917] transition-colors"
          >
            Categories
          </a>
          <NavLink to="/products?sort=newest" className={linkClass}>
            Brands
          </NavLink>
          <NavLink to="/track" className={linkClass}>
            Track Order
          </NavLink>
        </nav>

        {/* Right: Admin (only if ADMIN), Login Icon / UserButton, Bag Icon */}
        <div className="flex items-center gap-4 shrink-0">
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'hidden md:inline text-xs uppercase tracking-[0.14em] transition-colors',
                  isActive ? 'text-[#1C1917] font-semibold' : 'text-[#92400E] hover:text-[#1C1917]'
                )
              }
            >
              Admin
            </NavLink>
          )}

          {/* Clerk Auth: Sign In Icon when signed out, UserButton when signed in */}
          {isSignedIn ? (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8 rounded-sm border border-[#E7E5E4]',
                },
              }}
            />
          ) : (
            <SignInButton mode="modal">
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-sm text-[#1C1917] hover:bg-[#E7E5E4]/50 transition-colors cursor-pointer"
                aria-label="Sign in or create account"
                title="Login / Sign In"
              >
                <User className="h-[18px] w-[18px] stroke-[1.75]" />
              </button>
            </SignInButton>
          )}

          {/* Shopping Bag Icon Only (no "BAG" text) */}
          <button
            type="button"
            onClick={openCart}
            className="relative flex h-9 w-9 items-center justify-center rounded-sm text-[#1C1917] hover:bg-[#E7E5E4]/50 transition-colors cursor-pointer"
            aria-label="Open shopping bag"
            title="Shopping Bag"
          >
            <ShoppingBag className="h-[18px] w-[18px] stroke-[1.75]" />
            <span className="absolute -right-1 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1C1917] px-1 text-[10px] font-medium text-white tabular-nums">
              {totalCount}
            </span>
          </button>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            className="lg:hidden p-1.5 text-[#1C1917] cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#E7E5E4] bg-white px-6 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative mb-2 md:hidden">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#78716C]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bags..."
              className="h-9 w-full rounded-sm border border-[#E7E5E4] bg-[#FAFAF9] pl-9 pr-3 text-xs text-[#1C1917]"
            />
          </form>
          <Link
            to="/products"
            onClick={() => setMobileOpen(false)}
            className="block text-xs uppercase tracking-widest text-[#1C1917] py-1.5"
          >
            Collection
          </Link>
          <a
            href="/#categories"
            onClick={() => setMobileOpen(false)}
            className="block text-xs uppercase tracking-widest text-[#1C1917] py-1.5"
          >
            Categories
          </a>
          <Link
            to="/products?sort=newest"
            onClick={() => setMobileOpen(false)}
            className="block text-xs uppercase tracking-widest text-[#1C1917] py-1.5"
          >
            Brands
          </Link>
          <Link
            to="/track"
            onClick={() => setMobileOpen(false)}
            className="block text-xs uppercase tracking-widest text-[#1C1917] py-1.5"
          >
            Track Order
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileOpen(false)}
              className="block text-xs uppercase tracking-widest text-[#92400E] py-1.5 font-medium"
            >
              Admin Portal
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
