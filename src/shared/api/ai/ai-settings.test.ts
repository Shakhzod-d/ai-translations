describe('ai settings persistence', () => {
  it('migrates a v1 Claude key into the multi-provider shape', async () => {
    localStorage.setItem(
      'lr.ai-settings',
      JSON.stringify({ state: { apiKey: 'sk-ant-old', model: 'claude-sonnet-5-5' }, version: 1 }),
    );
    vi.resetModules();
    const { useAiSettings, isAiConfigured } = await import('./ai-settings');
    await useAiSettings.persist.rehydrate();
    const state = useAiSettings.getState();
    expect(state.provider).toBe('claude');
    expect(state.providers.claude).toEqual({ apiKey: 'sk-ant-old', model: 'claude-sonnet-5-5' });
    expect(isAiConfigured()).toBe(true);
  });

  it('defaults to Gemini with no key', async () => {
    vi.resetModules();
    const { useAiSettings, isAiConfigured } = await import('./ai-settings');
    expect(useAiSettings.getState().provider).toBe('gemini');
    expect(isAiConfigured()).toBe(false);
  });
});

describe('built-in AI', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('counts Gemini without a personal key as configured when the deployment has a proxy', async () => {
    vi.stubEnv('VITE_BUILTIN_AI', 'true');
    vi.resetModules();
    const { isAiConfigured, usesBuiltinAi, useAiSettings } = await import('./ai-settings');
    expect(isAiConfigured()).toBe(true);
    expect(usesBuiltinAi('gemini', '')).toBe(true);
    expect(usesBuiltinAi('gemini', 'AQ.personal')).toBe(false); // own key takes precedence
    expect(usesBuiltinAi('claude', '')).toBe(false); // proxy is Gemini-only
    useAiSettings.getState().setProvider('claude');
    expect(isAiConfigured()).toBe(false);
  });
});
