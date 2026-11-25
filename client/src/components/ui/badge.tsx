import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[#1C1917] text-white',
        secondary: 'bg-[#FAFAF9] text-[#78716C] border border-[#E7E5E4]',
        preorder: 'bg-[#92400E]/10 text-[#92400E] border border-[#92400E]/30',
        success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        destructive: 'bg-red-50 text-red-800 border border-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
