import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/lib';

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-error';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldClass, 'h-10', className)} {...props} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClass, 'min-h-24 py-2', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> extends Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value'
> {
  value: T;
  options: readonly SelectOption<T>[];
  onValueChange: (value: T) => void;
}

/** Native select: best accessibility and the platform picker on mobile. */
export const Select = <T extends string>({
  value,
  options,
  onValueChange,
  className,
  ...props
}: SelectProps<T>) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value as T)}
    className={cn(
      fieldClass,
      'h-10 appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-9',
      'select-chevron',
      className,
    )}
    {...props}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('text-foreground text-sm font-medium', className)} {...props} />
);

export const FieldError = ({ id, children }: { id?: string; children?: React.ReactNode }) =>
  children ? (
    <p id={id} role="alert" className="text-error text-sm">
      {children}
    </p>
  ) : null;
