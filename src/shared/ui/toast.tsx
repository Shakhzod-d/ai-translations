import * as ToastPrimitive from '@radix-ui/react-toast';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { create } from 'zustand';
import { cn, createId } from '@/shared/lib';

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: string;
  title: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

interface ToastStore {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (toast) => set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id: createId() }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (title: string, action?: ToastItem['action']) =>
    useToastStore.getState().push({ title, tone: 'success', action }),
  error: (title: string) => useToastStore.getState().push({ title, tone: 'error' }),
  info: (title: string) => useToastStore.getState().push({ title, tone: 'info' }),
};

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const toneClass = { success: 'text-success', error: 'text-error', info: 'text-primary' };

export const Toaster = ({ closeLabel }: { closeLabel: string }) => {
  const { toasts, dismiss } = useToastStore();
  return (
    <ToastPrimitive.Provider swipeDirection="down" duration={4000}>
      {toasts.map((item) => {
        const Icon = icons[item.tone];
        return (
          <ToastPrimitive.Root
            key={item.id}
            type={item.tone === 'error' ? 'foreground' : 'background'}
            onOpenChange={(open) => !open && dismiss(item.id)}
            className="border-border bg-popover text-popover-foreground data-[state=open]:animate-slide-up data-[swipe=end]:animate-fade-out flex items-center gap-3 rounded-xl border p-3 pr-2 text-sm shadow-xl"
          >
            <Icon className={cn('size-5 shrink-0', toneClass[item.tone])} aria-hidden />
            <ToastPrimitive.Title className="flex-1">{item.title}</ToastPrimitive.Title>
            {item.action && (
              <ToastPrimitive.Action
                altText={item.action.label}
                onClick={item.action.onClick}
                className="text-primary hover:bg-muted rounded-md px-2 py-1 font-medium"
              >
                {item.action.label}
              </ToastPrimitive.Action>
            )}
            <ToastPrimitive.Close
              aria-label={closeLabel}
              className="text-muted-foreground hover:bg-muted rounded-md p-1"
            >
              <X className="size-4" aria-hidden />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] mx-auto flex w-full max-w-sm flex-col gap-2 px-4 outline-none sm:right-6 sm:bottom-6 sm:left-auto sm:mx-0" />
    </ToastPrimitive.Provider>
  );
};
