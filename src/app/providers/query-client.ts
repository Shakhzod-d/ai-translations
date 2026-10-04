import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/shared/api';

const MAX_RETRIES = 2;

export const createQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => console.error('[query]', error),
    }),
    mutationCache: new MutationCache({
      onError: (error) => console.error('[mutation]', error),
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        // Only transient failures are retried; 404s and validation errors fail fast.
        retry: (count, error) => count < MAX_RETRIES && (!isApiError(error) || error.retryable),
      },
    },
  });
