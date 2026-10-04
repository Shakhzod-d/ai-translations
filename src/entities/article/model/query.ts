import { queryOptions, useQuery } from '@tanstack/react-query';
import { articlesApi } from '@/shared/api';

export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  detail: (id: string) => [...articleKeys.all, 'detail', id] as const,
  job: (jobId: string) => [...articleKeys.all, 'job', jobId] as const,
};

export const articleListQuery = () =>
  queryOptions({
    queryKey: articleKeys.lists(),
    queryFn: ({ signal }) => articlesApi.listArticles(signal),
  });

export const articleDetailQuery = (id: string) =>
  queryOptions({
    queryKey: articleKeys.detail(id),
    queryFn: ({ signal }) => articlesApi.getArticle(id, signal),
    staleTime: 5 * 60_000,
  });

export const useArticles = () => useQuery(articleListQuery());
export const useArticle = (id: string) => useQuery(articleDetailQuery(id));
