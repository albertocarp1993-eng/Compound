import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-[var(--line)] bg-[color:var(--surface-strong)] text-[color:var(--text)]',
        success: 'border-emerald-700/70 bg-emerald-500/15 text-emerald-300',
        warning: 'border-amber-700/70 bg-amber-500/15 text-amber-300',
        danger: 'border-rose-700/70 bg-rose-500/15 text-rose-300',
        info: 'border-sky-700/70 bg-sky-500/15 text-sky-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps): JSX.Element {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
