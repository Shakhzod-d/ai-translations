import { useMutation, useQueryClient } from '@tanstack/react-query';
import { articleKeys, type Article } from '@/entities/article';
import { articlesApi } from '@/shared/api';
import type { CefrLevel } from '@/shared/config';

export const useGenerateExercises = (articleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['generate-exercises', articleId],
    mutationFn: (level: CefrLevel) => articlesApi.generateExercises(articleId, level),
    onSuccess: (set) => {
      queryClient.setQueryData<Article>(articleKeys.detail(articleId), (article) =>
        article
          ? {
              ...article,
              exercises: [...article.exercises.filter((e) => e.level !== set.level), set],
            }
          : article,
      );
    },
  });
};
