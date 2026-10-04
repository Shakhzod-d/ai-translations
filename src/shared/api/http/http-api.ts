import { z } from 'zod';
import {
  articleSchema,
  articleSummarySchema,
  articleVersionSchema,
  processingJobSchema,
  translationSchema,
  vocabularyItemSchema,
  wordAnalysisSchema,
} from '../contracts';
import type { ArticlesApi, VocabularyApi } from '../types';
import { createHttpClient } from './http-client';

const voidSchema = z.unknown().transform(() => undefined);

export const createHttpApis = (
  baseUrl: string,
): { articles: ArticlesApi; vocabulary: VocabularyApi } => {
  const http = createHttpClient(baseUrl);

  const articles: ArticlesApi = {
    listArticles: (signal) =>
      http.request('/articles', { schema: z.array(articleSummarySchema), signal }),
    getArticle: (id, signal) => http.request(`/articles/${id}`, { schema: articleSchema, signal }),
    uploadArticle: (file, options) => {
      const form = new FormData();
      form.append('file', file);
      return http.upload('/articles/upload', form, { schema: processingJobSchema, ...options });
    },
    getProcessingJob: (jobId, signal) =>
      http.request(`/jobs/${jobId}`, { schema: processingJobSchema, signal }),
    updateArticle: (id, patch) =>
      http.request(`/articles/${id}`, {
        method: 'PATCH',
        body: patch,
        schema: articleSummarySchema,
      }),
    deleteArticle: (id) =>
      http.request(`/articles/${id}`, { method: 'DELETE', schema: voidSchema }),
    generateVersion: (articleId, level) =>
      http.request(`/articles/${articleId}/versions`, {
        method: 'POST',
        body: { type: 'simplified', level },
        schema: articleVersionSchema,
      }),
    translateText: (text, target, signal, context) =>
      http.request('/translate', {
        method: 'POST',
        body: { text, target, context },
        schema: translationSchema,
        signal,
      }),
    analyzeWord: (word, context, signal) =>
      http.request('/analyze-word', {
        method: 'POST',
        body: { word, context },
        schema: wordAnalysisSchema,
        signal,
      }),
  };

  const vocabulary: VocabularyApi = {
    listWords: (signal) =>
      http.request('/vocabulary', { schema: z.array(vocabularyItemSchema), signal }),
    saveWord: (item) =>
      http.request('/vocabulary', { method: 'POST', body: item, schema: vocabularyItemSchema }),
    deleteWord: (id) => http.request(`/vocabulary/${id}`, { method: 'DELETE', schema: voidSchema }),
  };

  return { articles, vocabulary };
};
