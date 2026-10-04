import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { articleKeys } from '@/entities/article';
import { validateFiles, type FileValidationError } from '@/entities/document';
import {
  articlesApi,
  toApiError,
  type ApiErrorCode,
  type ProcessingJob,
  type ProcessingStage,
} from '@/shared/api';

type ProcessingFailure = Extract<ProcessingJob, { status: 'failed' }>['errorCode'];

type Phase =
  | { status: 'idle' }
  | { status: 'invalid'; error: FileValidationError }
  | { status: 'uploading'; file: File; progress: number }
  | { status: 'processing'; file: File; jobId: string }
  | { status: 'error'; file: File; code: ApiErrorCode };

export type UploadState =
  | { status: 'idle' }
  | { status: 'invalid'; error: FileValidationError }
  | { status: 'uploading'; file: File; progress: number }
  | { status: 'processing'; file: File; stage: ProcessingStage }
  | { status: 'success'; file: File; articleId: string }
  | { status: 'error'; file: File; code: ApiErrorCode }
  | { status: 'processingFailed'; file: File; code: ProcessingFailure };

const POLL_INTERVAL_MS = 600;

export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);
  const jobId = phase.status === 'processing' ? phase.jobId : null;

  const job = useQuery({
    queryKey: articleKeys.job(jobId ?? ''),
    queryFn: ({ signal }) => articlesApi.getProcessingJob(jobId!, signal),
    enabled: !!jobId,
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? POLL_INTERVAL_MS : false,
    // Keep polling when the tab is hidden, so progress is current when the user comes back.
    refetchIntervalInBackground: true,
    retry: 2,
  });

  const completedId = job.data?.status === 'completed' ? job.data.articleId : null;
  useEffect(() => {
    if (completedId) void queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
  }, [completedId, queryClient]);

  const upload = useCallback(async (file: File) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPhase({ status: 'uploading', file, progress: 0 });
    try {
      const created = await articlesApi.uploadArticle(file, {
        signal: controller.signal,
        onProgress: (progress) =>
          setPhase((p) => (p.status === 'uploading' && p.file === file ? { ...p, progress } : p)),
      });
      if (!controller.signal.aborted) setPhase({ status: 'processing', file, jobId: created.id });
    } catch (error) {
      const { code } = toApiError(error);
      if (code !== 'ABORTED') setPhase({ status: 'error', file, code });
    }
  }, []);

  const start = useCallback(
    (files: File[]) => {
      const result = validateFiles(files);
      if (!result.ok) setPhase({ status: 'invalid', error: result.error });
      else void upload(result.file);
    },
    [upload],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setPhase({ status: 'idle' });
  }, []);

  const retry = useCallback(() => {
    if ('file' in phase) void upload(phase.file);
  }, [phase, upload]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const state = deriveState(phase, job.data, job.error);
  return { state, start, cancel, retry, reset: cancel };
};

const deriveState = (
  phase: Phase,
  job: ProcessingJob | undefined,
  jobError: unknown,
): UploadState => {
  if (phase.status !== 'processing') return phase;
  const { file } = phase;
  if (jobError) return { status: 'error', file, code: toApiError(jobError).code };
  if (!job || job.status === 'processing')
    return { status: 'processing', file, stage: job?.stage ?? 'uploading' };
  if (job.status === 'completed') return { status: 'success', file, articleId: job.articleId };
  return { status: 'processingFailed', file, code: job.errorCode };
};
