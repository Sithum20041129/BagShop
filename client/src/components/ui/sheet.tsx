import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sheet({
  open,
  onOpenChange,
  children,
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#1C1917]/40 backdrop-blur-[1px] transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'relative z-50 flex h-full w-full max-w-md flex-col bg-white border-l border-[#E7E5E4] shadow-xl'
        )}
      >
        <div className="flex items-start justify-between border-b border-[#E7E5E4] px-6 py-5">
          <div>
            {title && <h2 className="font-serif text-xl font-medium text-[#1C1917]">{title}</h2>}
            {description && <p className="mt-1 text-xs text-[#78716C]">{description}</p>}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-sm p-1 text-[#78716C] hover:bg-[#FAFAF9] hover:text-[#1C1917] cursor-pointer"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
