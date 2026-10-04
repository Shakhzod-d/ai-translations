import * as PopoverPrimitive from '@radix-ui/react-popover';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/lib';

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = ({
  className,
  sideOffset = 8,
  ...props
}: ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      sideOffset={sideOffset}
      collisionPadding={12}
      className={cn(
        'border-border bg-popover text-popover-foreground data-[state=open]:animate-scale-in z-50 rounded-xl border p-4 shadow-xl focus:outline-none',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);
