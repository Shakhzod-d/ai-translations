import { Skeleton, TextSkeleton } from '@/shared/ui';

export const ArticleSkeleton = () => (
  <div className="flex flex-col gap-8" aria-hidden>
    <Skeleton className="h-9 w-2/3" />
    {Array.from({ length: 4 }, (_, i) => (
      <TextSkeleton key={i} lines={4} />
    ))}
  </div>
);
