import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { vocabularyKeys, type NewVocabularyItem, type VocabularyItem } from '@/entities/vocabulary';
import type { WordAnalysis } from '@/entities/translation';
import { toApiError, vocabularyApi } from '@/shared/api';
import { toast } from '@/shared/ui';

export const analysisToVocabulary = (
  analysis: WordAnalysis,
  sourceDocumentId?: string,
): NewVocabularyItem => ({
  word: analysis.query,
  translation: analysis.translation,
  definition: analysis.definition,
  synonyms: analysis.synonyms.map((s) => s.word),
  antonyms: analysis.antonyms.map((s) => s.word),
  examples: analysis.examples,
  level: analysis.level,
  sourceDocumentId,
});

/** Optimistic: the saved indicator flips instantly; rolled back with a toast on failure. */
export const useSaveWord = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const key = vocabularyKeys.list();

  return useMutation({
    mutationFn: (item: NewVocabularyItem) => vocabularyApi.saveWord(item),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<VocabularyItem[]>(key);
      const optimistic: VocabularyItem = {
        ...item,
        id: `optimistic-${item.word}`,
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<VocabularyItem[]>(key, (old = []) => [optimistic, ...old]);
      return { previous };
    },
    onError: (error, _item, context) => {
      queryClient.setQueryData(key, context?.previous);
      toast.error(t(`errors.${toApiError(error).code}`));
    },
    onSuccess: (saved) => toast.success(t('vocabulary.savedToast', { word: saved.word })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};

export const useRemoveWord = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const key = vocabularyKeys.list();

  return useMutation({
    mutationFn: (item: VocabularyItem) => vocabularyApi.deleteWord(item.id),
    onMutate: async (item) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<VocabularyItem[]>(key);
      queryClient.setQueryData<VocabularyItem[]>(key, (old = []) =>
        old.filter((v) => v.id !== item.id),
      );
      return { previous };
    },
    onError: (error, _item, context) => {
      queryClient.setQueryData(key, context?.previous);
      toast.error(t(`errors.${toApiError(error).code}`));
    },
    onSuccess: (_data, item) => toast.info(t('vocabulary.removed', { word: item.word })),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
};
