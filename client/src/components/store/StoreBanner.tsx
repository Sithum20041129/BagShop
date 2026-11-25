import { Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function StoreBanner() {
  const { data } = useQuery({
    queryKey: ['store-status'],
    queryFn: api.getStoreStatus,
    staleTime: 30_000,
  });

  const settings = data?.settings;
  if (!settings || settings.isOpen) return null;

  return (
    <div className="bg-[#1C1917] text-[#FAFAF9] border-b border-[#92400E]/40">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-xs tracking-wide">
        <Clock className="h-3.5 w-3.5 shrink-0 text-[#D97706]" />
        <span>
          <strong className="font-medium uppercase tracking-widest text-[#F59E0B] mr-1.5">
            Pre-Orders Open
          </strong>
          {settings.closedMessage}
        </span>
      </div>
    </div>
  );
}
