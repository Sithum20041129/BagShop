import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await api.subscribeNewsletter(email.trim());
      toast.success(res.message);
      setEmail('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="border-t border-[#E7E5E4] bg-white">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2 space-y-3">
          <span className="font-serif text-xl font-semibold tracking-[0.18em] uppercase text-[#1C1917]">
            Bright Buy
          </span>
          <p className="max-w-sm text-sm leading-relaxed text-[#78716C]">
            Thoughtfully proportioned leather handbags, structured work totes, and islandwide
            travel pieces crafted for enduring everyday elegance.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#1C1917]">
            Client Care
          </h4>
          <ul className="space-y-2 text-sm text-[#78716C]">
            <li>
              <Link to="/products" className="hover:text-[#1C1917]">
                Shop Collection
              </Link>
            </li>
            <li>
              <Link to="/track" className="hover:text-[#1C1917]">
                Track Your Order
              </Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-[#1C1917]">
                Admin Portal
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-widest text-[#1C1917]">
            Private Releases
          </h4>
          <p className="text-xs text-[#78716C]">
            Receive quiet updates on new seasonal drops.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="h-9 text-xs"
            />
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? '...' : 'Join'}
            </Button>
          </form>
        </div>
      </div>

      <div className="border-t border-[#E7E5E4] px-4 py-5 text-center text-[11px] uppercase tracking-widest text-[#78716C]">
        © {new Date().getFullYear()} Bright Buy Sri Lanka • Prices in LKR
      </div>
    </footer>
  );
}
