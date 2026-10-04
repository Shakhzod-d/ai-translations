import { useTranslation } from 'react-i18next';
import type { PhrasalVerb } from '@/entities/article';
import type { LanguageCode } from '@/shared/config';

export const PhrasalVerbList = ({
  items,
  language,
  onSelect,
}: {
  items: PhrasalVerb[];
  language: LanguageCode;
  onSelect?: (pv: PhrasalVerb) => void;
}) => {
  const { t } = useTranslation();
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((pv) => (
        <li key={pv.phrase}>
          <button
            type="button"
            onClick={() => onSelect?.(pv)}
            className="border-border hover:bg-muted focus-visible:ring-ring w-full rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-semibold">{pv.phrase}</span>
              {pv.translation?.[language] && (
                <span lang={language} className="text-muted-foreground text-sm">
                  {pv.translation[language]}
                </span>
              )}
            </span>
            <span className="mt-1 block text-sm">
              <span className="sr-only">{t('learning.meaning')}: </span>
              {pv.meaning}
            </span>
            <span className="text-muted-foreground mt-1 block text-sm italic">{pv.example}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};
