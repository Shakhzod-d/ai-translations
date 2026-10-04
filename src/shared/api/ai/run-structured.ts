import type { z } from 'zod';
import { ApiError, toApiError } from '../errors';
import { AI_PROVIDER_INFO, getActiveAiConfig, usesBuiltinAi, type AiProvider } from './ai-settings';
import type { AiProviderClient, StructuredRequest } from './providers/types';

/** Providers are loaded on demand, so only the SDK actually used is downloaded. */
const loadProvider = async (provider: AiProvider): Promise<AiProviderClient> =>
  provider === 'gemini'
    ? (await import('./providers/gemini')).geminiProvider
    : (await import('./providers/claude')).claudeProvider;

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new ApiError('ABORTED'));
      },
      { once: true },
    );
  });

/**
 * Backoff with jitter (≈1s, 2s) for transient failures that usually clear quickly:
 * rate limits and network blips. Overload (AI_BUSY) is NOT retried on the same model —
 * it rarely clears within seconds, so we switch models immediately instead.
 */
const withRetry = async <T>(run: () => Promise<T>, signal?: AbortSignal): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      const apiError = toApiError(error);
      const retry = apiError.retryable && apiError.code !== 'AI_BUSY';
      if (!retry || attempt >= MAX_ATTEMPTS || signal?.aborted) throw apiError;
      await sleep(BASE_DELAY_MS * 2 ** (attempt - 1) * (0.75 + Math.random() * 0.5), signal);
    }
  }
};

/** How long an overloaded model is skipped before we try it again. */
export const BUSY_COOLDOWN_MS = 5 * 60_000;
const busyUntil = new Map<string, number>();
const isCoolingDown = (model: string) => (busyUntil.get(model) ?? 0) > Date.now();
const markBusy = (model: string) => busyUntil.set(model, Date.now() + BUSY_COOLDOWN_MS);
/** Test hook. */
export const resetModelHealth = () => busyUntil.clear();

/**
 * Candidate order: the chosen model first, then the provider's other models (list order).
 * Pro is excluded as a fallback: slower and pricier than what the user picked.
 * Models that recently returned "overloaded" are skipped, so after one 503
 * every following request goes straight to a working model — one request each.
 */
const candidateModels = (provider: AiProvider, model: string) => {
  const fallbacks = AI_PROVIDER_INFO[provider].models
    .map((m) => m.id)
    .filter((id) => id !== model && !(provider === 'gemini' && id.includes('pro')));
  const all = [model, ...fallbacks];
  const healthy = all.filter((m) => !isCoolingDown(m));
  // Everything cooling down: try the user's choice anyway rather than failing without a request.
  return healthy.length > 0 ? healthy : [model];
};

export const runStructured = async <S extends z.ZodType>(
  request: StructuredRequest<S>,
): Promise<z.infer<S>> => {
  const { provider, apiKey, model } = getActiveAiConfig();
  if (!apiKey && !usesBuiltinAi(provider, apiKey)) throw new ApiError('AI_NOT_CONFIGURED');
  const client = await loadProvider(provider);

  let lastError: ApiError = new ApiError('AI_BUSY');
  for (const candidate of candidateModels(provider, model)) {
    try {
      return await withRetry(
        () => client.runStructured(request, { apiKey, model: candidate }),
        request.signal,
      );
    } catch (error) {
      lastError = toApiError(error);
      if (lastError.code !== 'AI_BUSY') throw lastError;
      markBusy(candidate);
      console.warn(
        `[ai] ${candidate} overloaded; skipping it for ${BUSY_COOLDOWN_MS / 60_000} min`,
      );
    }
  }
  throw lastError;
};

/** Credential check before saving a key (no tokens spent). */
export const verifyApiKey = async (provider: AiProvider, apiKey: string, model: string) =>
  (await loadProvider(provider)).verifyKey({ apiKey, model });
