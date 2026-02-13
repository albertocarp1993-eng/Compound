import { cn } from '../../lib/utils';

function Skeleton({ className }: { className?: string }): JSX.Element {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gradient-to-r from-[color:var(--surface-strong)] via-[color:var(--surface-soft)] to-[color:var(--surface-strong)]', className)}
    />
  );
}

export { Skeleton };
