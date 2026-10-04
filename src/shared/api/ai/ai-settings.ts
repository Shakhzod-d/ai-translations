import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { env } from '@/shared/config';

export const AI_PROVIDERS = ['gemini', 'claude'] as const;
export type AiProvider = (typeof AI_PROVIDERS)[number];

/** Per-provider metadata. Adding a provider = an entry here + a module in ./providers. */
export const AI_PROVIDER_INFO = {
  gemini: {
    label: 'Google Gemini',
    // Example shown as a placeholder only; formats change (AI Studio moved from "AIza…" to "AQ.…" keys),
    // so keys are validated by a real API call, never by prefix.
    keyExample: 'AQ.…',
    host: 'generativelanguage.googleapis.com',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keySite: 'aistudio.google.com',
    // "-latest" aliases always resolve to Google's current model, so the list never goes stale.
    models: [
      { id: 'gemini-flash-latest', label: 'Gemini Flash (fast, recommended)' },
      { id: 'gemini-pro-latest', label: 'Gemini Pro (highest quality)' },
      { id: 'gemini-flash-lite-latest', label: 'Gemini Flash-Lite (cheapest)' },
    ],
  },
  claude: {
    label: 'Anthropic Claude',
    keyExample: 'sk-ant-…',
    host: 'api.anthropic.com',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keySite: 'console.anthropic.com',
    models: [
      { id: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
      { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
    ],
  },
} as const satisfies Record<
  AiProvider,
  {
    label: string;
    keyExample: string;
    host: string;
    keyUrl: string;
    keySite: string;
    models: readonly { id: string; label: string }[];
  }
>;

export const DEFAULT_AI_PROVIDER: AiProvider = 'gemini';

interface ProviderConfig {
  apiKey: string;
  model: string;
}

interface AiSettingsState {
  provider: AiProvider;
  providers: Record<AiProvider, ProviderConfig>;
  setProvider: (provider: AiProvider) => void;
  setApiKey: (provider: AiProvider, apiKey: string) => void;
  setModel: (provider: AiProvider, model: string) => void;
  clearKey: (provider: AiProvider) => void;
}

const defaults = (provider: AiProvider): ProviderConfig => ({
  apiKey: '',
  model: AI_PROVIDER_INFO[provider].models[0].id,
});

/**
 * Bring-your-own-key: each user's key lives only in their own browser and is sent
 * only to the chosen provider's API. Nothing secret is baked into the build.
 */
export const useAiSettings = create<AiSettingsState>()(
  persist(
    (set) => ({
      provider: DEFAULT_AI_PROVIDER,
      providers: { gemini: defaults('gemini'), claude: defaults('claude') },
      setProvider: (provider) => set({ provider }),
      setApiKey: (provider, apiKey) =>
        set((s) => ({
          providers: {
            ...s.providers,
            [provider]: { ...s.providers[provider], apiKey: apiKey.trim() },
          },
        })),
      setModel: (provider, model) =>
        set((s) => ({
          providers: { ...s.providers, [provider]: { ...s.providers[provider], model } },
        })),
      clearKey: (provider) =>
        set((s) => ({
          providers: { ...s.providers, [provider]: { ...s.providers[provider], apiKey: '' } },
        })),
    }),
    {
      name: 'lr.ai-settings',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // v1 stored a single Claude key: { apiKey, model }. Carry it over instead of dropping it.
      migrate: (persisted, version) => {
        const fresh = {
          provider: DEFAULT_AI_PROVIDER,
          providers: { gemini: defaults('gemini'), claude: defaults('claude') },
        };
        if (version >= 2) return persisted as typeof fresh;
        const old = (persisted ?? {}) as Partial<ProviderConfig>;
        if (!old.apiKey) return fresh;
        return {
          provider: 'claude' as const,
          providers: {
            ...fresh.providers,
            claude: { apiKey: old.apiKey, model: old.model ?? fresh.providers.claude.model },
          },
        };
      },
    },
  ),
);

export const getActiveAiConfig = () => {
  const { provider, providers } = useAiSettings.getState();
  return { provider, ...providers[provider] };
};

/** Gemini without a personal key goes through the deployment's server-side proxy, when available. */
export const usesBuiltinAi = (provider: AiProvider, apiKey: string) =>
  !apiKey && provider === 'gemini' && env.builtinAi;

const hasAi = (provider: AiProvider, apiKey: string) =>
  apiKey.length > 0 || usesBuiltinAi(provider, apiKey);

export const isAiConfigured = () => {
  const { provider, apiKey } = getActiveAiConfig();
  return hasAi(provider, apiKey);
};
export const useIsAiConfigured = () =>
  useAiSettings((s) => hasAi(s.provider, s.providers[s.provider].apiKey));
