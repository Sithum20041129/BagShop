import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function AdminLoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;
    setLoading(true);
    try {
      await api.adminLogin(passcode);
      await queryClient.invalidateQueries({ queryKey: ['admin-me'] });
      toast.success('Signed in to Bright Buy Admin');
      navigate('/admin', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid passcode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF9] px-4">
      <Link
        to="/"
        className="mb-8 font-serif text-2xl font-semibold tracking-[0.2em] uppercase text-[#1C1917]"
      >
        Bright Buy
      </Link>

      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E5E4] bg-[#FAFAF9]">
            <Lock className="h-4 w-4 text-[#1C1917]" />
          </div>
          <CardTitle>Admin Access</CardTitle>
          <p className="text-xs text-[#78716C]">
            Enter the Stage 1 store passcode to manage inventory and orders.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-passcode">Admin Passcode</Label>
              <Input
                id="admin-passcode"
                type="password"
                required
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode (dev: brightbuy2026)"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Enter Admin Portal'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
