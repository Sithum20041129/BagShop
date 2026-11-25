import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatLKR } from '@/lib/utils';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AdminDashboardPage() {
  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders', 'ALL'],
    queryFn: () => api.adminGetOrders(),
  });
  const { data: productsData } = useQuery({
    queryKey: ['admin-products'],
    queryFn: api.adminGetProducts,
  });

  const orders = ordersData?.orders || [];
  const products = productsData?.products || [];

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalLkr, 0);
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const preorderCount = orders.filter((o) => o.isPreorder).length;

  return (
    <AdminShell title="Overview">
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-[11px] uppercase tracking-widest text-[#78716C]">
                Total Revenue
              </p>
              <p className="mt-2 font-serif text-3xl font-medium text-[#1C1917] tabular-nums">
                {formatLKR(totalRevenue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-[11px] uppercase tracking-widest text-[#78716C]">
                Pending Review
              </p>
              <p className="mt-2 font-serif text-3xl font-medium text-[#92400E] tabular-nums">
                {pendingCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-[11px] uppercase tracking-widest text-[#78716C]">
                Pre-Orders Queue
              </p>
              <p className="mt-2 font-serif text-3xl font-medium text-[#1C1917] tabular-nums">
                {preorderCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <p className="text-[11px] uppercase tracking-widest text-[#78716C]">
                Catalog Pieces
              </p>
              <p className="mt-2 font-serif text-3xl font-medium text-[#1C1917] tabular-nums">
                {products.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-medium text-[#1C1917]">Recent Orders</h2>
              <Link to="/admin/orders" className="text-xs uppercase tracking-wider underline">
                Manage All Orders
              </Link>
            </div>

            {orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#78716C]">No orders yet.</p>
            ) : (
              <div className="divide-y divide-[#E7E5E4]">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1C1917]">{order.orderNumber}</span>
                        {order.isPreorder && <Badge variant="preorder">Pre-Order</Badge>}
                      </div>
                      <p className="text-xs text-[#78716C]">
                        {order.customerName} • {order.city}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 tabular-nums">
                      <Badge variant="secondary">{order.status}</Badge>
                      <span className="font-medium">{formatLKR(order.totalLkr)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
