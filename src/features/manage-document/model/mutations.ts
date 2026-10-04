import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { articleKeys, type ArticleSummary } from '@/entities/article';
import { articlesApi, toApiError, type ArticlePatch } from '@/shared/api';
import { toast } from '@/shared/ui';

export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const listKey = articleKeys.lists();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ArticlePatch }) =>
      articlesApi.updateArticle(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<ArticleSummary[]>(listKey);
      queryClient.setQueryData<ArticleSummary[]>(listKey, (old) =>
        old?.map((a) =>
          a.id === id
            ? {
                ...a,
                title: patch.title ?? a.title,
                metadata: {
                  ...a.metadata,
                  favorite: patch.favorite ?? a.metadata.favorite,
                  lastOpenedAt: patch.lastOpenedAt ?? a.metadata.lastOpenedAt,
                },
              }
            : a,
        ),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      queryClient.setQueryData(listKey, context?.previous);
      toast.error(t(`errors.${toApiError(error).code}`));
    },
    onSettled: (_data, _error, { id }) => {
      void queryClient.invalidateQueries({ queryKey: listKey });
      void queryClient.invalidateQueries({ queryKey: articleKeys.detail(id) });
    },
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (id: string) => articlesApi.deleteArticle(id),
    onSuccess: (_d, id) => {
      queryClient.setQueryData<ArticleSummary[]>(articleKeys.lists(), (old) =>
        old?.filter((a) => a.id !== id),
      );
      queryClient.removeQueries({ queryKey: articleKeys.detail(id) });
    },
    onError: (error) => toast.error(t(`errors.${toApiError(error).code}`)),
  });
};

/** Records "last opened" once per article visit (powers "Continue reading"). */
export const useMarkDocumentOpened = (id: string | undefined) => {
  const { mutate } = useUpdateDocument();
  useEffect(() => {
    if (id) mutate({ id, patch: { lastOpenedAt: new Date().toISOString() } });
  }, [id, mutate]);
};
