import * as Menu from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/lib';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuRadioGroup = Menu.RadioGroup;

export const DropdownMenuContent = ({
  className,
  sideOffset = 6,
  align = 'end',
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Content>) => (
  <Menu.Portal>
    <Menu.Content
      sideOffset={sideOffset}
      align={align}
      className={cn(
        'border-border bg-popover text-popover-foreground data-[state=open]:animate-scale-in z-50 min-w-44 rounded-xl border p-1 shadow-xl',
        className,
      )}
      {...props}
    />
  </Menu.Portal>
);

const itemClass =
  'relative flex cursor-default select-none items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-muted data-[disabled]:opacity-50 [&_svg]:size-4';

export const DropdownMenuItem = ({
  className,
  destructive,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Item> & { destructive?: boolean }) => (
  <Menu.Item className={cn(itemClass, destructive && 'text-error', className)} {...props} />
);

export const DropdownMenuRadioItem = ({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.RadioItem>) => (
  <Menu.RadioItem className={cn(itemClass, 'pr-8', className)} {...props}>
    {children}
    <Menu.ItemIndicator className="absolute right-2.5">
      <Check aria-hidden />
    </Menu.ItemIndicator>
  </Menu.RadioItem>
);

export const DropdownMenuLabel = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Label>) => (
  <Menu.Label
    className={cn('text-muted-foreground px-2.5 py-1.5 text-xs font-medium', className)}
    {...props}
  />
);

export const DropdownMenuSeparator = () => <Menu.Separator className="bg-border -mx-1 my-1 h-px" />;
