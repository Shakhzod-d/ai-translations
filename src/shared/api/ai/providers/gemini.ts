import {
  ApiError as GeminiApiError,
  FinishReason,
  GoogleGenAI,
  ThinkingLevel,
} from '@google/genai';
import { z } from 'zod';
import { ApiError } from '../../errors';
import type { AiEffort, AiProviderClient } from './types';

let cached: { key: string; client: GoogleGenAI } | null = null;
const getClient = (apiKey: string) => {
  if (cached?.key !== apiKey) cached = { key: apiKey, client: new GoogleGenAI({ apiKey }) };
  return cached.client;
};

const THINKING: Record<AiEffort, ThinkingLevel> = {
  low: ThinkingLevel.LOW,
  medium: ThinkingLevel.MEDIUM,
  high: ThinkingLevel.HIGH,
};

/** Gemini's SDK has a single error class with an HTTP status; map it to our codes. */
const toError = (error: unknown): ApiError => {
  if (error instanceof ApiError) return error;
  if (error instanceof DOMException && error.name === 'AbortError')
    return new ApiError('ABORTED', { cause: error });
  if (error instanceof GeminiApiError) {
    const { status } = error;
    // An invalid key is reported as 400 INVALID_ARGUMENT with reason API_KEY_INVALID.
    if (
      status === 401 ||
      status === 403 ||
      (status === 400 && /API_KEY_INVALID|API key/i.test(error.message))
    ) {
      return new ApiError('UNAUTHORIZED', { status, cause: error });
    }
    if (status === 429) return new ApiError('RATE_LIMITED', { status, cause: error });
    if (status === 400) return new ApiError('VALIDATION', { status, cause: error });
    if (status === 404) return new ApiError('VALIDATION', { status, cause: error });
    // 503 UNAVAILABLE = model overloaded; transient, worth retrying or falling back.
    if (status === 503) return new ApiError('AI_BUSY', { status, cause: error });
    if (status >= 500) return new ApiError('SERVER', { status, cause: error });
  }
  if (error instanceof TypeError) return new ApiError('NETWORK', { cause: error });
  return new ApiError('UNKNOWN', { cause: error });
};

/** Gemini takes a plain JSON Schema; the draft URI is not part of its accepted subset. */
const toJsonSchema = (schema: z.ZodType) => {
  const jsonSchema: Record<string, unknown> = { ...z.toJSONSchema(schema) };
  delete jsonSchema.$schema;
  return jsonSchema;
};

interface GenerateParams {
  model: string;
  system: string;
  prompt: string;
  jsonSchema: Record<string, unknown>;
  maxTokens: number;
  thinkingLevel: ThinkingLevel;
}
interface GenerateResult {
  text?: string;
  finishReason?: string;
  blockReason?: string;
}

const generateDirect = async (
  apiKey: string,
  p: GenerateParams,
  signal?: AbortSignal,
): Promise<GenerateResult> => {
  const response = await getClient(apiKey).models.generateContent({
    model: p.model,
    contents: p.prompt,
    config: {
      systemInstruction: p.system,
      responseMimeType: 'application/json',
      responseJsonSchema: p.jsonSchema,
      maxOutputTokens: p.maxTokens,
      thinkingConfig: { thinkingLevel: p.thinkingLevel },
      abortSignal: signal,
    },
  });
  return {
    text: response.text,
    finishReason: response.candidates?.[0]?.finishReason,
    blockReason: response.promptFeedback?.blockReason,
  };
};

const PROXY_URL = '/api/ai/gemini';
const proxyErrorSchema = z.object({ error: z.string() });
const proxyResultSchema = z.object({
  text: z.string().optional(),
  finishReason: z.string().optional(),
  blockReason: z.string().optional(),
});

const generateViaProxy = async (
  p: GenerateParams,
  signal?: AbortSignal,
): Promise<GenerateResult> => {
  let response: Response;
  try {
    response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
      signal,
    });
  } catch (error) {
    throw toError(error);
  }
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = proxyErrorSchema.safeParse(json).data?.error;
    throw new ApiError(isKnownCode(code) ? code : 'SERVER', { status: response.status });
  }
  const parsed = proxyResultSchema.safeParse(json);
  if (!parsed.success) throw new ApiError('INVALID_RESPONSE', { cause: parsed.error });
  return parsed.data;
};

const PROXY_CODES = [
  'AI_NOT_CONFIGURED',
  'AI_BUSY',
  'RATE_LIMITED',
  'VALIDATION',
  'UNAUTHORIZED',
  'SERVER',
] as const;
const isKnownCode = (code: string | undefined): code is (typeof PROXY_CODES)[number] =>
  (PROXY_CODES as readonly string[]).includes(code ?? '');

export const geminiProvider: AiProviderClient = {
  async runStructured(
    { system, prompt, schema, effort = 'low', maxTokens = 16000, signal },
    { apiKey, model },
  ) {
    try {
      const params = {
        model,
        system,
        prompt,
        jsonSchema: toJsonSchema(schema),
        maxTokens,
        thinkingLevel: THINKING[effort],
      };
      // No personal key → the deployment's server-side proxy (the key never reaches the browser).
      const response = apiKey
        ? await generateDirect(apiKey, params, signal)
        : await generateViaProxy(params, signal);
      if (response.blockReason) throw new ApiError('AI_REFUSED');
      const finish = response.finishReason;
      if (
        finish === FinishReason.SAFETY ||
        finish === FinishReason.PROHIBITED_CONTENT ||
        finish === FinishReason.BLOCKLIST
      ) {
        throw new ApiError('AI_REFUSED');
      }
      if (finish === FinishReason.MAX_TOKENS || !response.text)
        throw new ApiError('INVALID_RESPONSE');
      const parsed = schema.safeParse(JSON.parse(response.text));
      if (!parsed.success) throw new ApiError('INVALID_RESPONSE', { cause: parsed.error });
      return parsed.data;
    } catch (error) {
      if (error instanceof SyntaxError) throw new ApiError('INVALID_RESPONSE', { cause: error });
      throw toError(error);
    }
  },

  async verifyKey({ apiKey, model }) {
    try {
      await new GoogleGenAI({ apiKey }).models.get({ model });
    } catch (error) {
      throw toError(error);
    }
  },
};
