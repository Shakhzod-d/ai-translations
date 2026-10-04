import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { articlesApi, isApiError } from '@/shared/api';
import type { LanguageCode } from '@/shared/config';
import { normalizeWord } from '@/shared/lib';

export const translationKeys = {
  all: ['translation'] as const,
  text: (text: string, target: LanguageCode) =>
    [...translationKeys.all, 'text', target, text] as const,
  word: (word: string) => [...translationKeys.all, 'word', normalizeWord(word)] as const,
};

const AI_RESULT_STALE_TIME = 60 * 60_000;
/** AI calls are paid; never hammer the API on failure. */
const AI_RETRY = (failureCount: number, error: Error) =>
  failureCount < 1 && isApiError(error) && error.retryable;

export const useWordAnalysis = (word: string | null, context?: string) =>
  useQuery({
    queryKey: translationKeys.word(word ?? ''),
    queryFn: ({ signal }) => articlesApi.analyzeWord(word!, context, signal),
    enabled: !!word,
    staleTime: AI_RESULT_STALE_TIME,
    retry: AI_RETRY,
  });

export const useTextTranslation = (text: string | null, target: LanguageCode, context?: string) =>
  useQuery({
    queryKey: translationKeys.text(text ?? '', target),
    queryFn: ({ signal }) => articlesApi.translateText(text!, target, signal, context),
    enabled: !!text,
    staleTime: AI_RESULT_STALE_TIME,
    retry: AI_RETRY,
    placeholderData: keepPreviousData,
  });
