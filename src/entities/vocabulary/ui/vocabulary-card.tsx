import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { VocabularyItem } from '@/shared/api';
import { SUPPORTED_LANGUAGES } from '@/shared/config';
import { Badge, Card } from '@/shared/ui';

export const VocabularyCard = ({
  item,
  actions,
}: {
  item: VocabularyItem;
  actions?: ReactNode;
}) => {
  const { t } = useTranslation();
  const translations = SUPPORTED_LANGUAGES.flatMap((lng) => {
    const value = item.translation[lng];
    return value && value.toLowerCase() !== item.word.toLowerCase() ? [{ lng, value }] : [];
  });
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{item.word}</h3>
          {item.synonyms && item.synonyms.length > 0 && (
            <p className="text-muted-foreground text-sm">{item.synonyms.slice(0, 3).join(' / ')}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {item.level && <Badge variant="primary">{item.level}</Badge>}
          {actions}
        </div>
      </div>
      {translations.length > 0 && (
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {translations.map(({ lng, value }) => (
            <div key={lng} className="flex gap-1.5">
              <dt className="text-muted-foreground font-medium uppercase">{lng}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {item.definition && <p className="text-sm">{item.definition}</p>}
      {item.examples?.[0] && (
        <p className="border-primary/40 text-muted-foreground mt-auto border-l-2 pl-3 text-sm italic">
          <span className="sr-only">{t('vocabulary.example')}: </span>
          {item.examples[0]}
        </p>
      )}
    </Card>
  );
};
