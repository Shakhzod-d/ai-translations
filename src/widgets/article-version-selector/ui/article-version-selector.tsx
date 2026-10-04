import { Sparkles } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersionLabel, type VersionSlot } from '@/entities/article';
import { cn } from '@/shared/lib';
import { Select } from '@/shared/ui';

interface ArticleVersionSelectorProps {
  slots: VersionSlot[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

/**
 * Tablet/desktop: a scrollable row of radio chips. Mobile: native select (platform picker).
 * Ungenerated versions are marked with an icon + accessible text, not color alone.
 */
export const ArticleVersionSelector = ({
  slots,
  value,
  onChange,
  className,
}: ArticleVersionSelectorProps) => {
  const { t } = useTranslation();
  const label = useVersionLabel();
  const selectId = useId();
  const options = slots.map((s) => ({
    value: s.id,
    label: s.version ? label(s) : `${label(s)} ✦`,
  }));

  return (
    <div className={className}>
      <label htmlFor={selectId} className="sr-only">
        {t('reader.versions')}
      </label>
      <Select
        id={selectId}
        className="sm:hidden"
        value={value}
        onValueChange={onChange}
        options={options}
      />
      <div
        role="radiogroup"
        aria-label={t('reader.versions')}
        className="hidden [scrollbar-width:thin] gap-1.5 overflow-x-auto pb-1 sm:flex"
      >
        {slots.map((slot) => {
          const active = slot.id === value;
          return (
            <button
              key={slot.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(slot.id)}
              className={cn(
                'focus-visible:ring-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {label(slot)}
              {!slot.version && (
                <>
                  <Sparkles className="size-3" aria-hidden />
                  <span className="sr-only">
                    ({t('reader.generate', { level: slot.level ?? '' })})
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
