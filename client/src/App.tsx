import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

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

import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
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
        <Routes>
          {/* Customer Storefront */}
          <Route element={<StorefrontLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/track" element={<TrackOrderPage />} />
          </Route>

          {/* Admin Portal */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
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
