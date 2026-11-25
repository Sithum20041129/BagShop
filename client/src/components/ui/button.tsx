import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-xs font-medium tracking-wide uppercase transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1C1917] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-[#1C1917] text-white hover:bg-[#1C1917]/90',
        outline:
          'border border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-[#FAFAF9] hover:border-[#1C1917]',
        ghost: 'text-[#1C1917] hover:bg-[#E7E5E4]/50',
        accent: 'bg-[#92400E] text-white hover:bg-[#92400E]/90',
        destructive: 'bg-red-700 text-white hover:bg-red-800',
        link: 'text-[#1C1917] underline-offset-4 hover:underline normal-case tracking-normal',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 text-[11px]',
        lg: 'h-12 px-8 text-xs',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = 'Button';
