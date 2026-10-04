import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MEDIA, STORAGE_KEYS } from '@/shared/config';

export const THEME_MODES = ['light', 'dark', 'system'] as const;
export type ThemeMode = (typeof THEME_MODES)[number];
export type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist((set) => ({ mode: 'system', setMode: (mode) => set({ mode }) }), {
    name: STORAGE_KEYS.theme,
    storage: createJSONStorage(() => localStorage),
    version: 1,
  }),
);

export const resolveTheme = (mode: ThemeMode, prefersDark: boolean): ResolvedTheme =>
  mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;

export const applyTheme = (theme: ResolvedTheme) => {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
};

export const systemPrefersDark = () => window.matchMedia(MEDIA.dark).matches;
