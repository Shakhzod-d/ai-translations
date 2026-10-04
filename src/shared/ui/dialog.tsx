import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/shared/lib';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const Overlay = () => (
  <DialogPrimitive.Overlay className="bg-overlay data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out fixed inset-0 z-50" />
);

interface DialogContentProps extends Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  'title'
> {
  title: ReactNode;
  description?: ReactNode;
  closeLabel: string;
  /** Visually hide the title (still announced). */
  hideTitle?: boolean;
}

export const DialogContent = ({
  title,
  description,
  closeLabel,
  hideTitle,
  className,
  children,
  ...props
}: DialogContentProps) => (
  <DialogPrimitive.Portal>
    <Overlay />
    <DialogPrimitive.Content
      className={cn(
        'border-border bg-popover text-popover-foreground data-[state=open]:animate-scale-in fixed top-1/2 left-1/2 z-50 flex max-h-[85dvh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto rounded-2xl border p-5 shadow-xl focus:outline-none',
        className,
      )}
      {...(description ? {} : { 'aria-describedby': undefined })}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <DialogPrimitive.Title className={cn('text-lg font-semibold', hideTitle && 'sr-only')}>
            {title}
          </DialogPrimitive.Title>
          {description && (
            <DialogPrimitive.Description className="text-muted-foreground text-sm">
              {description}
            </DialogPrimitive.Description>
          )}
        </div>
        <DialogPrimitive.Close
          className="text-muted-foreground hover:bg-muted focus-visible:ring-ring -m-1 rounded-md p-1 focus-visible:ring-2 focus-visible:outline-none"
          aria-label={closeLabel}
        >
          <X className="size-5" aria-hidden />
        </DialogPrimitive.Close>
      </div>
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
    {...props}
  />
);

type DrawerSide = 'bottom' | 'right' | 'left';

interface DrawerContentProps extends Omit<
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
  'title'
> {
  side?: DrawerSide;
  title: ReactNode;
  closeLabel: string;
  hideTitle?: boolean;
  /** Keep the page interactive behind a bottom sheet (no overlay, no focus trap). */
  modal?: boolean;
}

const sideClass: Record<DrawerSide, string> = {
  bottom:
    'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t pb-[max(1rem,env(safe-area-inset-bottom))] data-[state=open]:animate-slide-up',
  right: 'inset-y-0 right-0 w-[min(24rem,90vw)] border-l data-[state=open]:animate-slide-left',
  left: 'inset-y-0 left-0 w-[min(20rem,85vw)] border-r data-[state=open]:animate-slide-right',
};

/** Drawer / BottomSheet built on the accessible dialog primitive (focus trap, Esc, aria-modal). */
export const DrawerContent = ({
  side = 'bottom',
  title,
  closeLabel,
  hideTitle,
  className,
  children,
  ...props
}: DrawerContentProps) => (
  <DialogPrimitive.Portal>
    <Overlay />
    <DialogPrimitive.Content
      aria-describedby={undefined}
      className={cn(
        'border-border bg-popover text-popover-foreground fixed z-50 flex flex-col shadow-2xl focus:outline-none',
        sideClass[side],
        className,
      )}
      {...props}
    >
      {side === 'bottom' && (
        <div
          aria-hidden
          className="bg-muted-foreground/30 mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full"
        />
      )}
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-2">
        <DialogPrimitive.Title className={cn('text-base font-semibold', hideTitle && 'sr-only')}>
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Close
          className="text-muted-foreground hover:bg-muted focus-visible:ring-ring ml-auto rounded-md p-1.5 focus-visible:ring-2 focus-visible:outline-none"
          aria-label={closeLabel}
        >
          <X className="size-5" aria-hidden />
        </DialogPrimitive.Close>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

export const Drawer = DialogPrimitive.Root;
export const BottomSheet = DialogPrimitive.Root;
export const BottomSheetContent = (props: Omit<DrawerContentProps, 'side'>) => (
  <DrawerContent side="bottom" {...props} />
);
