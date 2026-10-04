import { useTranslation } from 'react-i18next';
import type { VocabularyFilters } from '@/entities/vocabulary';
import {
  CEFR_LEVELS,
  LANGUAGE_NATIVE_NAMES,
  SUPPORTED_LANGUAGES,
  type CefrLevel,
  type LanguageCode,
} from '@/shared/config';
import { SearchField, Select } from '@/shared/ui';

interface Props {
  filters: VocabularyFilters;
  onChange: (patch: Partial<VocabularyFilters>) => void;
}

export const VocabularyFiltersBar = ({ filters, onChange }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <SearchField
        value={filters.search}
        onChange={(search) => onChange({ search })}
        label={t('vocabulary.search')}
        className="col-span-2 sm:w-64"
      />
      <Select<CefrLevel | 'all'>
        aria-label={t('vocabulary.level')}
        className="sm:w-40"
        value={filters.level}
        onValueChange={(level) => onChange({ level })}
        options={[
          { value: 'all', label: t('vocabulary.allLevels') },
          ...CEFR_LEVELS.map((l) => ({ value: l, label: l })),
        ]}
      />
      <Select<LanguageCode | 'all'>
        aria-label={t('vocabulary.translatedTo')}
        className="sm:w-44"
        value={filters.language}
        onValueChange={(language) => onChange({ language })}
        options={[
          { value: 'all', label: t('vocabulary.anyLanguage') },
          ...SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_NATIVE_NAMES[l] })),
        ]}
      />
      <Select
        aria-label={t('vocabulary.sort')}
        className="col-span-2 sm:col-span-1 sm:w-48"
        value={filters.sort}
        onValueChange={(sort) => onChange({ sort })}
        options={[
          { value: 'recent', label: t('vocabulary.sortRecent') },
          { value: 'alpha', label: t('vocabulary.sortAlpha') },
        ]}
      />
    </div>
  );
};
