import type { z } from 'zod';

export type AiEffort = 'low' | 'medium' | 'high';

export interface StructuredRequest<S extends z.ZodType> {
  system: string;
  prompt: string;
  schema: S;
  effort?: AiEffort;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ProviderCallOptions {
  apiKey: string;
  model: string;
}

/** Every provider returns JSON already validated against the request's Zod schema. */
export interface AiProviderClient {
  runStructured<S extends z.ZodType>(
    request: StructuredRequest<S>,
    options: ProviderCallOptions,
  ): Promise<z.infer<S>>;
  verifyKey(options: ProviderCallOptions): Promise<void>;
}
