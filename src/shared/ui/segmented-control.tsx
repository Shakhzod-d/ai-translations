import { cn } from '@/shared/lib';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: readonly SegmentedOption<T>[];
  onValueChange: (value: T) => void;
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}

/** Radio-group semantics: one choice among a small, always-visible set. */
export const SegmentedControl = <T extends string>({
  value,
  options,
  onValueChange,
  label,
  className,
  size = 'md',
}: SegmentedControlProps<T>) => (
  <div
    role="radiogroup"
    aria-label={label}
    className={cn('bg-muted inline-flex rounded-lg p-1', className)}
    onKeyDown={(e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const index = options.findIndex((o) => o.value === value);
      const next =
        options[(index + (e.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length];
      if (next) {
        onValueChange(next.value);
        (
          e.currentTarget.querySelector(`[data-value="${next.value}"]`) as HTMLElement | null
        )?.focus();
      }
    }}
  >
    {options.map((option) => {
      const selected = option.value === value;
      return (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={selected}
          data-value={option.value}
          tabIndex={selected ? 0 : -1}
          onClick={() => onValueChange(option.value)}
          className={cn(
            'text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none [&_svg]:size-4',
            size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
            selected && 'bg-background text-foreground shadow-sm',
          )}
        >
          {option.icon}
          {option.label}
        </button>
      );
    })}
  </div>
);
