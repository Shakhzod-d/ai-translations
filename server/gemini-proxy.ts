import { ApiError as GeminiApiError, GoogleGenAI } from '@google/genai';
import { z } from 'zod';

/**
 * Server-side Gemini proxy. The deployment's key (GEMINI_API_KEY) lives only in the
 * server environment and never reaches the browser. Used by api/ai/gemini.ts on Vercel
 * and by the Vite dev middleware locally.
 */

/** Keep in sync with AI_PROVIDER_INFO.gemini.models (the server can't import app code). */
const ALLOWED_MODELS = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro-latest',
] as const;
const MAX_PROMPT_CHARS = 60_000;
const MAX_OUTPUT_TOKENS = 16_000;

export const proxyRequestSchema = z.object({
  model: z.enum(ALLOWED_MODELS),
  system: z.string().max(4_000),
  prompt: z.string().min(1).max(MAX_PROMPT_CHARS),
  jsonSchema: z.record(z.string(), z.unknown()),
  maxTokens: z.number().int().positive().max(MAX_OUTPUT_TOKENS),
  thinkingLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
});
export type ProxyRequest = z.infer<typeof proxyRequestSchema>;

export interface ProxyResponse {
  status: number;
  body: { text?: string; finishReason?: string; blockReason?: string } | { error: string };
}

const fail = (status: number, error: string): ProxyResponse => ({ status, body: { error } });

export const handleGeminiProxy = async (
  raw: unknown,
  apiKey: string | undefined,
): Promise<ProxyResponse> => {
  if (!apiKey) return fail(503, 'AI_NOT_CONFIGURED');
  const parsed = proxyRequestSchema.safeParse(raw);
  if (!parsed.success) return fail(400, 'VALIDATION');
  const { model, system, prompt, jsonSchema, maxTokens, thinkingLevel } = parsed.data;

  try {
    const response = await new GoogleGenAI({ apiKey }).models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: system,
        responseMimeType: 'application/json',
        responseJsonSchema: jsonSchema,
        maxOutputTokens: maxTokens,
        thinkingConfig: { thinkingLevel: thinkingLevel as never },
      },
    });
    return {
      status: 200,
      body: {
        text: response.text,
        finishReason: response.candidates?.[0]?.finishReason,
        blockReason: response.promptFeedback?.blockReason,
      },
    };
  } catch (error) {
    // Raw provider errors are logged server-side only; the client gets a normalized code.
    console.error('[gemini-proxy]', error);
    if (error instanceof GeminiApiError) {
      if (error.status === 503) return fail(503, 'AI_BUSY');
      if (error.status === 429) return fail(429, 'RATE_LIMITED');
      if (error.status === 400 || error.status === 401 || error.status === 403)
        return fail(502, 'AI_NOT_CONFIGURED');
    }
    return fail(502, 'SERVER');
  }
};

/** Blocks casual use of the endpoint from other websites. Not a substitute for rate limiting. */
export const isSameOrigin = (origin: string | null, host: string | null) => {
  if (!origin) return true; // same-origin fetches may omit Origin
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};
