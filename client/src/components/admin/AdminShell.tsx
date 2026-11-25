import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  ShoppingBag,
  ClipboardList,
  Settings,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: ShoppingBag },
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/settings', label: 'Store Settings', icon: Settings },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: storeData } = useQuery({
    queryKey: ['store-status'],
    queryFn: api.getStoreStatus,
  });

  const isOpen = storeData?.settings?.isOpen ?? true;

  const handleLogout = async () => {
    await api.adminLogout();
    await queryClient.invalidateQueries({ queryKey: ['admin-me'] });
    toast.success('Logged out of Admin Portal');
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-[#FAFAF9]">
      {/* Fixed Left Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-[#E7E5E4] bg-white md:flex">
        <div className="flex h-16 items-center border-b border-[#E7E5E4] px-6">
          <Link
            to="/admin"
            className="font-serif text-lg font-semibold tracking-[0.16em] uppercase text-[#1C1917]"
          >
            Bright Buy
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-sm px-3 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors',
                    isActive
                      ? 'bg-[#1C1917] text-white'
                      : 'text-[#78716C] hover:bg-[#FAFAF9] hover:text-[#1C1917]'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-[#E7E5E4] p-4 space-y-2">
          <Link
            to="/"
            className="flex items-center justify-between rounded-sm border border-[#E7E5E4] px-3 py-2 text-xs text-[#1C1917] hover:bg-[#FAFAF9]"
          >
            <span>View Storefront</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#78716C]" />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-[#78716C] hover:text-red-700"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-[#E7E5E4] bg-white px-6">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-2xl font-medium text-[#1C1917]">{title}</h1>
            {isOpen ? (
              <Badge variant="success">Store Open</Badge>
            ) : (
              <Badge variant="preorder">Closed • Pre-Order Mode</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Link to="/admin/orders" className="text-xs underline">
              Orders
            </Link>
            <Link to="/admin/products" className="text-xs underline">
              Products
            </Link>
            <Link to="/admin/settings" className="text-xs underline">
              Settings
            </Link>
            <button onClick={handleLogout} className="text-xs text-red-700 ml-2">
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
