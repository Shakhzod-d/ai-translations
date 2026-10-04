import { z } from 'zod';
import { ApiError } from '../errors';
import { createHttpClient } from './http-client';

const schema = z.object({ id: z.string() });

describe('http client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns validated data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: '1' }), { status: 200 })),
    );
    await expect(createHttpClient('/api').request('/x', { schema })).resolves.toEqual({ id: '1' });
  });

  it('rejects responses that break the contract', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200 })),
    );
    await expect(createHttpClient('/api').request('/x', { schema })).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('maps HTTP status to a normalized error code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('raw AI stacktrace', { status: 429 })),
    );
    const error = await createHttpClient('/api')
      .request('/x', { schema })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'RATE_LIMITED', retryable: true });
  });

  it('reports network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(createHttpClient('/api').request('/x', { schema })).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });
});
