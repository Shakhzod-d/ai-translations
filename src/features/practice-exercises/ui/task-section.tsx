import { useId, type ReactNode } from 'react';

/** A numbered block of one task type, e.g. "1. Multiple choice". */
export const TaskSection = ({
  index,
  title,
  hint,
  children,
}: {
  index: number;
  title: string;
  hint: string;
  children: ReactNode;
}) => {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span
          className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          aria-hidden
        >
          {index}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h2 id={id} className="text-lg leading-7 font-semibold">
            {title}
          </h2>
          <p className="text-muted-foreground text-sm">{hint}</p>
        </div>
      </div>
      <ol className="flex flex-col gap-3 sm:pl-10">{children}</ol>
    </section>
  );
};
