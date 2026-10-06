import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '@/shared/api';
import { articleKeys } from './query';

const POLL_INTERVAL_MS = 600;

/** Polls a processing job (file upload or pasted text) until it completes or fails. */
export const useProcessingJob = (jobId: string | null) =>
  useQuery({
    queryKey: articleKeys.job(jobId ?? ''),
    queryFn: ({ signal }) => articlesApi.getProcessingJob(jobId!, signal),
    enabled: !!jobId,
    refetchInterval: (query) =>
      query.state.data?.status === 'processing' ? POLL_INTERVAL_MS : false,
    // Keep polling when the tab is hidden, so progress is current when the user comes back.
    refetchIntervalInBackground: true,
    retry: 2,
  });
