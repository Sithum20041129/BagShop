import { Check, XCircle } from 'lucide-react';
import type { OrderStatus } from '@shared/schemas/order.schema';
import { cn } from '@/lib/utils';

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PACKING', label: 'Packing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export function OrderStepper({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <XCircle className="h-5 w-5 shrink-0" />
        <span>This order has been cancelled.</span>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="w-full py-2">
      <div className="grid grid-cols-5 gap-2">
        {STEPS.map((step, idx) => {
          const completed = idx <= currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step.key} className="flex flex-col items-center text-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                  completed
                    ? 'border-[#1C1917] bg-[#1C1917] text-white'
                    : 'border-[#E7E5E4] bg-white text-[#78716C]',
                  active && 'ring-2 ring-[#92400E]/30 ring-offset-2'
                )}
              >
                {completed ? <Check className="h-4 w-4" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'mt-2 text-[11px] uppercase tracking-wider',
                  completed ? 'font-medium text-[#1C1917]' : 'text-[#78716C]'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
