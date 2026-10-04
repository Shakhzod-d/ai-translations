const generateContent = vi.fn();
vi.mock('@google/genai', async (importOriginal) => {
  const actual = await importOriginal<typeof GenAi>();
  return {
    ...actual,
    GoogleGenAI: vi.fn(function () {
      return { models: { generateContent } };
    }),
  };
});

import type * as GenAi from '@google/genai';
const { handleGeminiProxy, isSameOrigin } = await import('./gemini-proxy');
const { ApiError: GeminiApiError } = await import('@google/genai');

const valid = {
  model: 'gemini-flash-latest',
  system: 's',
  prompt: 'p',
  jsonSchema: { type: 'object' },
  maxTokens: 1000,
  thinkingLevel: 'LOW',
};

describe('gemini proxy', () => {
  beforeEach(() => generateContent.mockReset());

  it('reports a missing server key without calling Google', async () => {
    expect(await handleGeminiProxy(valid, undefined)).toEqual({
      status: 503,
      body: { error: 'AI_NOT_CONFIGURED' },
    });
    expect(generateContent).not.toHaveBeenCalled();
  });

  it('rejects disallowed models and oversized requests', async () => {
    expect((await handleGeminiProxy({ ...valid, model: 'some-expensive-model' }, 'k')).status).toBe(
      400,
    );
    expect((await handleGeminiProxy({ ...valid, maxTokens: 999_999 }, 'k')).status).toBe(400);
    expect((await handleGeminiProxy({ ...valid, prompt: 'x'.repeat(70_000) }, 'k')).status).toBe(
      400,
    );
  });

  it('returns only the text and finish signals', async () => {
    generateContent.mockResolvedValue({
      text: '{"a":1}',
      candidates: [{ finishReason: 'STOP' }],
      promptFeedback: {},
    });
    expect(await handleGeminiProxy(valid, 'k')).toEqual({
      status: 200,
      body: { text: '{"a":1}', finishReason: 'STOP', blockReason: undefined },
    });
  });

  it('normalizes provider errors without leaking details', async () => {
    generateContent.mockImplementationOnce(async () => {
      throw new GeminiApiError({ status: 503, message: 'overloaded internals' });
    });
    expect(await handleGeminiProxy(valid, 'k')).toEqual({
      status: 503,
      body: { error: 'AI_BUSY' },
    });
  });

  it('only accepts same-origin browser requests', () => {
    expect(isSameOrigin('https://app.vercel.app', 'app.vercel.app')).toBe(true);
    expect(isSameOrigin('https://evil.example', 'app.vercel.app')).toBe(false);
    expect(isSameOrigin(null, 'app.vercel.app')).toBe(true);
  });
});
