import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().optional().or(z.literal('')),
  /** Public flag: the deployment runs the /api/ai/gemini proxy with its own (server-side) key. */
  VITE_BUILTIN_AI: z.enum(['true', 'false']).optional(),
  MODE: z.string(),
});

const parsed = envSchema.parse(import.meta.env);

export const env = {
  apiUrl: parsed.VITE_API_URL || null,
  isTest: parsed.MODE === 'test',
  builtinAi: parsed.VITE_BUILTIN_AI === 'true',
} as const;
