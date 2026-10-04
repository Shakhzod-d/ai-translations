import { z } from 'zod';
import { ApiError } from '../errors';
import { useAiSettings } from './ai-settings';

const runStructured = vi.fn();
vi.mock('./providers/gemini', () => ({
  geminiProvider: {
    runStructured: (...args: unknown[]) => runStructured(...args),
    verifyKey: vi.fn(),
  },
}));

const { runStructured: run, resetModelHealth, BUSY_COOLDOWN_MS } = await import('./run-structured');
const request = { system: 's', prompt: 'p', schema: z.object({ ok: z.boolean() }) };
const calledModels = () =>
  runStructured.mock.calls.map((call) => (call[1] as { model: string }).model);

describe('runStructured', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    runStructured.mockReset();
    resetModelHealth();
    useAiSettings.setState({ provider: 'gemini' });
    useAiSettings.getState().setApiKey('gemini', 'AQ.test');
    useAiSettings.getState().setModel('gemini', 'gemini-flash-latest');
  });
  afterEach(() => vi.useRealTimers());

  it('retries rate limits with backoff on the same model', async () => {
    runStructured
      .mockRejectedValueOnce(new ApiError('RATE_LIMITED'))
      .mockResolvedValueOnce({ ok: true });
    const promise = run(request);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ ok: true });
    expect(calledModels()).toEqual(['gemini-flash-latest', 'gemini-flash-latest']);
  });

  it('switches models immediately on overload, then uses one request per call', async () => {
    runStructured.mockImplementation(async (_req: unknown, { model }: { model: string }) => {
      if (model === 'gemini-flash-latest') throw new ApiError('AI_BUSY');
      return { ok: true };
    });
    await run(request);
    expect(calledModels()).toEqual(['gemini-flash-latest', 'gemini-flash-lite-latest']);

    runStructured.mockClear();
    await run(request);
    expect(calledModels()).toEqual(['gemini-flash-lite-latest']);
  });

  it('tries the preferred model again after the cooldown', async () => {
    runStructured.mockRejectedValueOnce(new ApiError('AI_BUSY')).mockResolvedValue({ ok: true });
    await run(request);
    vi.advanceTimersByTime(BUSY_COOLDOWN_MS + 1);
    runStructured.mockClear();
    await run(request);
    expect(calledModels()).toEqual(['gemini-flash-latest']);
  });

  it('fails with a clear error when every model is overloaded', async () => {
    runStructured.mockRejectedValue(new ApiError('AI_BUSY'));
    await expect(run(request)).rejects.toHaveProperty('code', 'AI_BUSY');
    expect(calledModels()).toEqual(['gemini-flash-latest', 'gemini-flash-lite-latest']);
  });

  it('does not retry errors that cannot succeed', async () => {
    runStructured.mockRejectedValue(new ApiError('UNAUTHORIZED'));
    await expect(run(request)).rejects.toHaveProperty('code', 'UNAUTHORIZED');
    expect(runStructured).toHaveBeenCalledTimes(1);
  });
});
