import { env } from '@/shared/config';
import { createHttpApis } from './http/http-api';
import { createLocalApis } from './local/local-api';
import { createMockApis } from './mock/mock-api';
import type { ArticlesApi, VocabularyApi } from './types';

/**
 * Adapter selection:
 * - VITE_API_URL set → your backend over HTTP
 * - tests            → deterministic in-memory mock
 * - otherwise        → serverless: IndexedDB + Claude directly from the browser (BYOK)
 */
const apis = env.apiUrl
  ? createHttpApis(env.apiUrl)
  : env.isTest
    ? createMockApis({ latency: 0, persist: false })
    : createLocalApis();

export const articlesApi: ArticlesApi = apis.articles;
export const vocabularyApi: VocabularyApi = apis.vocabulary;

export * from './contracts';
export * from './errors';
export type * from './types';
export { createMockApis } from './mock/mock-api';
export {
  useAiSettings,
  useIsAiConfigured,
  AI_PROVIDERS,
  AI_PROVIDER_INFO,
  DEFAULT_AI_PROVIDER,
  usesBuiltinAi,
  type AiProvider,
} from './ai/ai-settings';
export { verifyApiKey } from './ai/run-structured';
