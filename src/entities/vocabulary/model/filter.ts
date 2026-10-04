import type { VocabularyItem } from '@/shared/api';
import type { CefrLevel, LanguageCode } from '@/shared/config';

export type VocabularySort = 'recent' | 'alpha';

export interface VocabularyFilters {
  search: string;
  level: CefrLevel | 'all';
  language: LanguageCode | 'all';
  sort: VocabularySort;
}

export const DEFAULT_VOCABULARY_FILTERS: VocabularyFilters = {
  search: '',
  level: 'all',
  language: 'all',
  sort: 'recent',
};

export const filterVocabulary = (
  items: VocabularyItem[],
  { search, level, language, sort }: VocabularyFilters,
) => {
  const query = search.trim().toLocaleLowerCase();
  const result = items.filter((item) => {
    if (level !== 'all' && item.level !== level) return false;
    if (language !== 'all' && !item.translation[language]) return false;
    if (!query) return true;
    return [
      item.word,
      item.phrase,
      item.definition,
      ...Object.values(item.translation),
      ...(item.synonyms ?? []),
    ].some((field) => field?.toLocaleLowerCase().includes(query));
  });
  return result.sort((a, b) =>
    sort === 'alpha' ? a.word.localeCompare(b.word) : b.createdAt.localeCompare(a.createdAt),
  );
};
