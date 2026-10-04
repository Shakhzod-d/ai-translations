import { cn } from '@/shared/lib';

export const Skeleton = ({ className }: { className?: string }) => (
  <div
    aria-hidden
    className={cn('bg-muted animate-pulse rounded-md motion-reduce:animate-none', className)}
  />
);

export const TextSkeleton = ({ lines = 4, className }: { lines?: number; className?: string }) => (
  <div className={cn('flex flex-col gap-2.5', className)} aria-hidden>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-3/5' : 'w-full')} />
    ))}
  </div>
);
