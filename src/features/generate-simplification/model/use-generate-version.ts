import { useMutation, useQueryClient } from '@tanstack/react-query';
import { articleKeys, type Article } from '@/entities/article';
import { articlesApi } from '@/shared/api';
import type { CefrLevel } from '@/shared/config';

export const useGenerateVersion = (articleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['generate-version', articleId],
    mutationFn: (level: CefrLevel) => articlesApi.generateVersion(articleId, level),
    onSuccess: (version) => {
      queryClient.setQueryData<Article>(articleKeys.detail(articleId), (article) =>
        article && !article.versions.some((v) => v.id === version.id)
          ? { ...article, versions: [...article.versions, version] }
          : article,
      );
      void queryClient.invalidateQueries({ queryKey: articleKeys.lists() });
    },
  });
};
