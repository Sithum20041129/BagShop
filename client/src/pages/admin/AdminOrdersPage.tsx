import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { OrderDTO, OrderStatus } from '@shared/schemas/order.schema';
import { api } from '@/lib/api';
import { formatLKR } from '@/lib/utils';
import { AdminShell } from '@/components/admin/AdminShell';
import { OrderDetailDrawer } from '@/components/admin/OrderDetailDrawer';
import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [filterTab, setFilterTab] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<OrderDTO | null>(null);
  const [updating, setUpdating] = useState(false);

  const queryParams =
    filterTab === 'PREORDERS'
      ? { preorder: true }
      : filterTab === 'ALL'
        ? undefined
        : { status: filterTab };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', filterTab],
    queryFn: () => api.adminGetOrders(queryParams),
  });

  const orders = data?.orders || [];

  const handleUpdateStatus = async (
    id: number,
    status: OrderStatus,
    trackingCode?: string | null
  ) => {
    setUpdating(true);
    try {
      const res = await api.adminUpdateOrderStatus(id, status, trackingCode);
      setSelectedOrder(res.order);
      await queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success(`Order ${res.order.orderNumber} updated to ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AdminShell title="Orders">
      <div className="space-y-6">
        <Tabs
          value={filterTab}
          onChange={setFilterTab}
          tabs={[
            { value: 'ALL', label: 'All' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'PREORDERS', label: 'Pre-Orders' },
            { value: 'CONFIRMED', label: 'Confirmed' },
            { value: 'SHIPPED', label: 'Shipped' },
            { value: 'DELIVERED', label: 'Delivered' },
          ]}
        />

        <div className="rounded-sm border border-[#E7E5E4] bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total (LKR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#78716C]">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#78716C]">
                    No orders in this view.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#1C1917]">{order.orderNumber}</span>
                        {order.isPreorder && <Badge variant="preorder">Pre-Order</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-[#1C1917]">{order.customerName}</p>
                      <p className="text-xs text-[#78716C]">{order.customerPhone}</p>
                    </TableCell>
                    <TableCell className="text-[#78716C]">{order.city}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === 'CANCELLED'
                            ? 'destructive'
                            : order.status === 'DELIVERED' || order.status === 'CONFIRMED'
                              ? 'success'
                              : 'secondary'
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatLKR(order.totalLkr)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <OrderDetailDrawer
        order={selectedOrder}
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        updating={updating}
      />
    </AdminShell>
  );
}
