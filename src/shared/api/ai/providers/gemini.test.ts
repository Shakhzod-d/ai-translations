import type * as GenAi from '@google/genai';
import { z } from 'zod';

const generateContent = vi.fn();
const getModel = vi.fn();

vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal<typeof GenAi>();
  return {
    ...actual,
    GoogleGenAI: vi.fn(function () {
      return { models: { generateContent, get: getModel } };
    }),
  };
});

const { geminiProvider } = await import('./gemini');
const { ApiError: GeminiApiError, FinishReason } = await import('@google/genai');

const schema = z.object({ translation: z.string() });
const request = { system: 's', prompt: 'p', schema };
const options = { apiKey: 'AIza-test', model: 'gemini-flash-latest' };

describe('gemini provider', () => {
  beforeEach(() => generateContent.mockReset());

  it('requests JSON constrained to the schema and validates the result', async () => {
    generateContent.mockResolvedValue({
      text: '{"translation":"salom"}',
      candidates: [{ finishReason: FinishReason.STOP }],
    });
    await expect(geminiProvider.runStructured(request, options)).resolves.toEqual({
      translation: 'salom',
    });
    const { config } = generateContent.mock.calls[0]![0];
    expect(config.responseMimeType).toBe('application/json');
    expect(config.responseJsonSchema).toMatchObject({ type: 'object', required: ['translation'] });
    expect(config.responseJsonSchema).not.toHaveProperty('$schema');
  });

  it('rejects output that does not match the schema', async () => {
    generateContent.mockResolvedValue({
      text: '{"wrong":1}',
      candidates: [{ finishReason: FinishReason.STOP }],
    });
    await expect(geminiProvider.runStructured(request, options)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('reports safety blocks as refusals', async () => {
    generateContent.mockResolvedValue({
      text: '',
      candidates: [{ finishReason: FinishReason.SAFETY }],
    });
    await expect(geminiProvider.runStructured(request, options)).rejects.toMatchObject({
      code: 'AI_REFUSED',
    });
  });

  it.each([
    [400, 'API key not valid. Please pass a valid API key. [API_KEY_INVALID]', 'UNAUTHORIZED'],
    [429, 'Resource exhausted', 'RATE_LIMITED'],
    [503, 'Overloaded', 'AI_BUSY'],
    [500, 'Internal', 'SERVER'],
  ])('maps HTTP %i to %s', async (status, message, code) => {
    generateContent.mockImplementationOnce(async () => {
      throw new GeminiApiError({ status, message });
    });
    const error = await geminiProvider.runStructured(request, options).catch((e: unknown) => e);
    expect(error).toHaveProperty('code', code);
  });
});
