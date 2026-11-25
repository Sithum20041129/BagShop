import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function PasscodeGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-me'],
    queryFn: api.adminMe,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !data?.authenticated) {
      navigate('/admin/login', { replace: true });
    }
  }, [isLoading, data, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9] text-xs uppercase tracking-widest text-[#78716C]">
        Verifying Admin Session...
      </div>
    );
  }

  if (!data?.authenticated) return null;

  return <>{children}</>;
}
