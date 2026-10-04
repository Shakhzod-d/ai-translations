import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/shared/lib';

interface ProgressProps {
  /** 0..1; omit for indeterminate */
  value?: number;
  label: string;
  className?: string;
}

export const Progress = ({ value, label, className }: ProgressProps) => {
  const percent =
    value === undefined ? undefined : Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <ProgressPrimitive.Root
      value={percent ?? null}
      aria-label={label}
      className={cn('bg-muted relative h-2 w-full overflow-hidden rounded-full', className)}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'bg-primary h-full transition-transform duration-300 motion-reduce:transition-none',
          percent === undefined && 'animate-indeterminate w-1/3 motion-reduce:animate-none',
        )}
        style={percent === undefined ? undefined : { transform: `translateX(-${100 - percent}%)` }}
      />
    </ProgressPrimitive.Root>
  );
};
