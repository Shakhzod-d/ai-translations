import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib';

export const Spinner = ({ className, label }: { className?: string; label?: string }) => (
  <>
    <Loader2
      aria-hidden
      className={cn('size-5 animate-spin motion-reduce:animate-none', className)}
    />
    {label && <span className="sr-only">{label}</span>}
  </>
);
