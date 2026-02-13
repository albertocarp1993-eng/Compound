import { cn } from '../../lib/utils';

function Skeleton({ className }: { className?: string }): JSX.Element {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800', className)}
    />
  );
}

export { Skeleton };
