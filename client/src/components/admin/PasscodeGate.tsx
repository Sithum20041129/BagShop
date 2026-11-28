import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SignInButton, useAuth, useUser } from '@clerk/react';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PasscodeGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();

  const { data, isLoading } = useQuery({
    queryKey: ['auth-me', userId],
    queryFn: api.getAuthMe,
    enabled: Boolean(isLoaded && isSignedIn && userId),
    retry: 2,
  });

  const metaRole = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const isAdmin =
    data?.user?.role === 'ADMIN' || metaRole?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    if (isLoaded && isSignedIn && !isLoading && !isAdmin && data?.user) {
      toast.error('Admin privileges required');
      navigate('/', { replace: true });
    }
  }, [isLoaded, isSignedIn, isLoading, isAdmin, data, navigate]);

  if (!isLoaded || (isSignedIn && isLoading && !isAdmin)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9] text-xs uppercase tracking-widest text-[#78716C]">
        Verifying Admin Access...
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAF9] px-4">
        <Link
          to="/"
          className="mb-8 font-serif text-2xl font-semibold tracking-[0.2em] uppercase text-[#1C1917]"
        >
          Bright Buy
        </Link>

        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E5E4] bg-[#FAFAF9]">
              <Shield className="h-4 w-4 text-[#1C1917]" />
            </div>
            <CardTitle>Admin Portal</CardTitle>
            <p className="text-xs text-[#78716C]">
              Sign in with your authorized Clerk administrator account to continue.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <SignInButton mode="modal">
              <Button className="w-full">Sign In with Clerk</Button>
            </SignInButton>
            <Link to="/" className="block text-xs text-[#78716C] hover:text-[#1C1917] underline">
              Return to Storefront
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
