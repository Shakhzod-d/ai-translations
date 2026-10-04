import { Upload } from 'lucide-react';
import { useId, useRef, useState, type DragEvent, type ReactNode } from 'react';
import { cn } from '@/shared/lib';
import { buttonVariants } from './button';

interface FileDropzoneProps {
  accept: string;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  title: ReactNode;
  activeTitle: ReactNode;
  hint?: ReactNode;
  browseLabel: string;
  orLabel: string;
  className?: string;
}

/** Generic, domain-free drop target. Validation is the caller's responsibility. */
export const FileDropzone = ({
  accept,
  onFiles,
  disabled,
  title,
  activeTitle,
  hint,
  browseLabel,
  orLabel,
  className,
}: FileDropzoneProps) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const depth = useRef(0);

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    depth.current = 0;
    setDragging(false);
    if (!disabled) onFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current++;
        setDragging(true);
      }}
      onDragLeave={() => {
        if (--depth.current <= 0) setDragging(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      data-dragging={dragging || undefined}
      className={cn(
        'border-border bg-card data-[dragging]:border-primary data-[dragging]:bg-primary/5 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
        disabled && 'opacity-60',
        className,
      )}
    >
      <div className="bg-primary/10 text-primary rounded-full p-3" aria-hidden>
        <Upload className="size-6" />
      </div>
      <p className="text-base font-medium">{dragging ? activeTitle : title}</p>
      <p className="text-muted-foreground hidden text-sm sm:block">{orLabel}</p>
      <label
        htmlFor={inputId}
        className={cn(
          buttonVariants({ variant: 'primary' }),
          'focus-within:ring-ring cursor-pointer focus-within:ring-2',
          disabled && 'pointer-events-none',
        )}
      >
        {browseLabel}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            onFiles(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
      </label>
      {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
    </div>
  );
};
