import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useTextTranslation } from '@/entities/translation';
import { LANGUAGE_NATIVE_NAMES, SUPPORTED_LANGUAGES, type LanguageCode } from '@/shared/config';
import { Label, QueryErrorState, Select, TextSkeleton } from '@/shared/ui';

interface TranslateSelectionProps {
  text: string;
  context?: string;
  target: LanguageCode;
  onTargetChange: (lng: LanguageCode) => void;
}

export const TranslateSelection = ({
  text,
  context,
  target,
  onTargetChange,
}: TranslateSelectionProps) => {
  const { t } = useTranslation();
  const selectId = useId();
  const { data, isPending, isFetching, error, refetch } = useTextTranslation(text, target, context);

  return (
    <div className="flex flex-col gap-4">
      <blockquote className="bg-muted rounded-lg p-3 text-sm">
        <span className="sr-only">{t('learning.selection')}: </span>“{text}”
      </blockquote>
      <div className="flex items-center gap-3">
        <Label htmlFor={selectId} className="shrink-0">
          {t('learning.translateTo')}
        </Label>
        <Select
          id={selectId}
          value={target}
          onValueChange={onTargetChange}
          options={SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_NATIVE_NAMES[l] }))}
        />
      </div>
      <section aria-live="polite" aria-busy={isFetching} className="flex flex-col gap-2">
        <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t('learning.translation')}
        </h3>
        {isPending ? (
          <TextSkeleton lines={2} />
        ) : error ? (
          <QueryErrorState error={error} onRetry={() => void refetch()} />
        ) : (
          <p lang={target} className="text-base">
            {data.translatedText}
          </p>
        )}
      </section>
    </div>
  );
};
