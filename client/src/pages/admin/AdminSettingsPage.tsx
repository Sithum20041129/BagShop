import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { AdminShell } from '@/components/admin/AdminShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['store-status'],
    queryFn: api.getStoreStatus,
  });

  const [isOpen, setIsOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState('');
  const [businessHours, setBusinessHours] = useState('');
  const [shippingFeeLkr, setShippingFeeLkr] = useState('650');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setIsOpen(data.settings.isOpen);
      setClosedMessage(data.settings.closedMessage);
      setBusinessHours(data.settings.businessHours);
      setShippingFeeLkr(String(data.settings.shippingFeeLkr));
    }
  }, [data]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.adminUpdateStoreStatus({
        isOpen,
        closedMessage: closedMessage.trim(),
        businessHours: businessHours.trim(),
        shippingFeeLkr: Number(shippingFeeLkr) || 0,
      });
      await queryClient.invalidateQueries({ queryKey: ['store-status'] });
      toast.success(
        isOpen ? 'Store is now Open' : 'Store switched to Closed (Pre-Order Mode)'
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell title="Store Settings">
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Store Availability & Pre-Order Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-start justify-between gap-4 rounded-sm border border-[#E7E5E4] bg-[#FAFAF9] p-4">
                <div>
                  <p className="text-sm font-medium text-[#1C1917]">
                    {isOpen ? 'Store is Currently Open' : 'Store is Closed (Pre-Order Mode Active)'}
                  </p>
                  <p className="mt-1 text-xs text-[#78716C]">
                    When closed, customers will see your notice banner and can continue placing
                    pre-orders.
                  </p>
                </div>
                <Switch
                  id="store-open-switch"
                  checked={isOpen}
                  onCheckedChange={setIsOpen}
                />
              </div>

              <div>
                <Label htmlFor="closed-msg">Closed Store / Pre-Order Banner Message</Label>
                <Textarea
                  id="closed-msg"
                  required
                  value={closedMessage}
                  onChange={(e) => setClosedMessage(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="biz-hours">Business Hours</Label>
                  <Input
                    id="biz-hours"
                    required
                    value={businessHours}
                    onChange={(e) => setBusinessHours(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="ship-fee">Default Shipping Fee (LKR)</Label>
                  <Input
                    id="ship-fee"
                    type="number"
                    required
                    min={0}
                    value={shippingFeeLkr}
                    onChange={(e) => setShippingFeeLkr(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? 'Saving Settings...' : 'Save Store Settings'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
