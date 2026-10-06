import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { articleKeys, useProcessingJob } from '@/entities/article';
import {
  articlesApi,
  toApiError,
  type ApiErrorCode,
  type ProcessingJob,
  type ProcessingStage,
} from '@/shared/api';
import type { ImportTextValues } from './import-schema';

type ProcessingFailure = Extract<ProcessingJob, { status: 'failed' }>['errorCode'];

export type ImportState =
  | { status: 'idle' }
  | { status: 'processing'; stage: ProcessingStage }
  | { status: 'success'; articleId: string }
  | { status: 'error'; code: ApiErrorCode }
  | { status: 'processingFailed'; code: ProcessingFailure };

/** Pasted text goes through the same processing job as an uploaded file. */
export const useImportText = () => {
  const queryClient = useQueryClient();
  const start = useMutation({
    mutationFn: (values: ImportTextValues) =>
      articlesApi.importText({
        text: values.text,
        title: values.title || undefined,
        source: values.source || undefined,
        level: values.level,
        withExercises: values.withExercises,
      }),
  });
  const job = useProcessingJob(start.data?.id ?? null);

  const completedId = job.data?.status === 'completed' ? job.data.articleId : null;
  useEffect(() => {
    if (completedId) void queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
  }, [completedId, queryClient]);

  const state = ((): ImportState => {
    if (start.isError) return { status: 'error', code: toApiError(start.error).code };
    if (!start.data && !start.isPending) return { status: 'idle' };
    if (job.error) return { status: 'error', code: toApiError(job.error).code };
    const data = job.data ?? start.data;
    if (!data || data.status === 'processing')
      return {
        status: 'processing',
        stage: data?.status === 'processing' ? data.stage : 'uploading',
      };
    if (data.status === 'completed') return { status: 'success', articleId: data.articleId };
    return { status: 'processingFailed', code: data.errorCode };
  })();

  return {
    state,
    submit: (values: ImportTextValues) => start.mutate(values),
    retry: () => start.variables && start.mutate(start.variables),
    reset: () => start.reset(),
    withExercises: start.variables?.withExercises ?? false,
  };
};
