import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import type { z } from 'zod';
import { ApiError } from '../../errors';
import type { AiProviderClient } from './types';

/** Haiku 4.5 has no effort control and no server-side fallback. */
const supportsEffortAndFallbacks = (model: string) => model !== 'claude-haiku-4-5';

let cached: { key: string; client: Anthropic } | null = null;
const getClient = (apiKey: string) => {
  if (cached?.key !== apiKey) {
    // Safe here because the key is the end user's own, entered at runtime — never shipped in the bundle.
    cached = {
      key: apiKey,
      client: new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 }),
    };
  }
  return cached.client;
};

const toError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (error instanceof Anthropic.APIUserAbortError)
    return new ApiError('ABORTED', { cause: error });
  if (
    error instanceof Anthropic.AuthenticationError ||
    error instanceof Anthropic.PermissionDeniedError
  ) {
    return new ApiError('UNAUTHORIZED', { status: error.status, cause: error });
  }
  if (error instanceof Anthropic.RateLimitError)
    return new ApiError('RATE_LIMITED', { status: 429, cause: error });
  if (error instanceof Anthropic.BadRequestError)
    return new ApiError('VALIDATION', { status: 400, cause: error });
  if (error instanceof Anthropic.APIConnectionTimeoutError)
    return new ApiError('TIMEOUT', { cause: error });
  if (error instanceof Anthropic.APIConnectionError)
    return new ApiError('NETWORK', { cause: error });
  if (error instanceof Anthropic.APIError)
    return new ApiError('SERVER', { status: error.status, cause: error });
  return new ApiError('UNKNOWN', { cause: error });
};

export const claudeProvider: AiProviderClient = {
  async runStructured(
    { system, prompt, schema, effort = 'low', maxTokens = 16000, signal },
    { apiKey, model },
  ) {
    const advanced = supportsEffortAndFallbacks(model);
    try {
      const response = await getClient(apiKey).beta.messages.parse(
        {
          model,
          max_tokens: maxTokens,
          system,
          messages: [{ role: 'user', content: prompt }],
          output_config: { format: betaZodOutputFormat(schema), ...(advanced ? { effort } : {}) },
          // Server-side fallback: if a safety classifier declines, the API retries on a suitable model.
          ...(advanced
            ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
            : {}),
        },
        { signal },
      );
      if (response.stop_reason === 'refusal') throw new ApiError('AI_REFUSED');
      if (response.stop_reason === 'max_tokens' || response.parsed_output == null)
        throw new ApiError('INVALID_RESPONSE');
      return response.parsed_output as z.infer<typeof schema>;
    } catch (error) {
      throw toError(error);
    }
  },

  async verifyKey({ apiKey, model }) {
    try {
      await new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 0 }).models.retrieve(
        model,
      );
    } catch (error) {
      throw toError(error);
    }
  },
};
