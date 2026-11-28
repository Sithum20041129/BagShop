import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/react';
import { useEffect } from 'react';
import { Toaster } from 'sonner';

import { api, setAuthTokenGetter } from '@/lib/api';
import { StoreBanner } from '@/components/store/StoreBanner';
import { Navbar } from '@/components/store/Navbar';
import { CartDrawer } from '@/components/store/CartDrawer';
import { Footer } from '@/components/store/Footer';
import { PasscodeGate } from '@/components/admin/PasscodeGate';

import { HomePage } from '@/pages/store/HomePage';
import { ProductsPage } from '@/pages/store/ProductsPage';
import { ProductDetailPage } from '@/pages/store/ProductDetailPage';
import { CheckoutPage } from '@/pages/store/CheckoutPage';
import { TrackOrderPage } from '@/pages/store/TrackOrderPage';

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminProductsPage } from '@/pages/admin/AdminProductsPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
    },
  },
});

function ClerkAuthHandler() {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Register token getter immediately
  setAuthTokenGetter(() => getToken());

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    if (isSignedIn && userId) {
      void qc.invalidateQueries({ queryKey: ['auth-me', userId] });
    } else if (isLoaded && !isSignedIn) {
      sessionStorage.removeItem('bb_admin_redirected');
    }
  }, [getToken, isLoaded, isSignedIn, userId, qc]);

  const { data: authData } = useQuery({
    queryKey: ['auth-me', userId],
    queryFn: api.getAuthMe,
    enabled: Boolean(isLoaded && isSignedIn && userId),
    retry: 2,
  });

  // Redirect Admin users straight to /admin once upon sign-in
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    const metaRole = (user?.publicMetadata as { role?: string } | undefined)?.role;
    const isAdmin =
      authData?.user?.role === 'ADMIN' || metaRole?.toUpperCase() === 'ADMIN';

    if (isAdmin && sessionStorage.getItem('bb_admin_redirected') !== userId) {
      sessionStorage.setItem('bb_admin_redirected', userId);
      if (!location.pathname.startsWith('/admin')) {
        navigate('/admin', { replace: true });
      }
    }
  }, [isLoaded, isSignedIn, userId, user, authData, location.pathname, navigate]);

  return null;
}

function StorefrontLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <StoreBanner />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ClerkAuthHandler />
        <Routes>
          {/* Customer Storefront */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/track" element={<TrackOrderPage />} />
          </Route>

          {/* Admin Portal (Protected by Clerk ADMIN role) */}
          <Route path="/admin/login" element={<Navigate to="/admin" replace />} />
          <Route
            path="/admin"
            element={
              <PasscodeGate>
                <AdminDashboardPage />
              </PasscodeGate>
            }
          />
          <Route
            path="/admin/products"
            element={
              <PasscodeGate>
                <AdminProductsPage />
              </PasscodeGate>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <PasscodeGate>
                <AdminOrdersPage />
              </PasscodeGate>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <PasscodeGate>
                <AdminSettingsPage />
              </PasscodeGate>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

export default App;
