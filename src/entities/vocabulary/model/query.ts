import { queryOptions, useQuery } from '@tanstack/react-query';
import { vocabularyApi } from '@/shared/api';
import { normalizeWord } from '@/shared/lib';

export const vocabularyKeys = {
  all: ['vocabulary'] as const,
  list: () => [...vocabularyKeys.all, 'list'] as const,
};

export const vocabularyListQuery = () =>
  queryOptions({
    queryKey: vocabularyKeys.list(),
    queryFn: ({ signal }) => vocabularyApi.listWords(signal),
  });

export const useVocabulary = () => useQuery(vocabularyListQuery());

/** O(1) "is this word saved?" lookups for the reader. */
export const useSavedWordIndex = () =>
  useQuery({
    ...vocabularyListQuery(),
    select: (items) => new Map(items.map((item) => [normalizeWord(item.word), item])),
  });
