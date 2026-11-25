import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Dialog({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#1C1917]/45 backdrop-blur-[1px]"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'relative z-50 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm border border-[#E7E5E4] bg-white p-6 shadow-xl',
          className
        )}
      >
        <div className="mb-5 flex items-start justify-between border-b border-[#E7E5E4] pb-4">
          <div>
            {title && <h2 className="font-serif text-2xl font-medium text-[#1C1917]">{title}</h2>}
            {description && <p className="mt-1 text-xs text-[#78716C]">{description}</p>}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-sm p-1 text-[#78716C] hover:bg-[#FAFAF9] hover:text-[#1C1917] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
