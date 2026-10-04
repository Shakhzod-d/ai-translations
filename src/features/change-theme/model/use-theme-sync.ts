import { useEffect } from 'react';
import { useMediaQuery } from '@/shared/lib';
import { MEDIA } from '@/shared/config';
import { applyTheme, resolveTheme, useThemeStore } from './theme-store';

/** Keeps <html> in sync with the chosen mode and live OS changes. Mounted once in the app. */
export const useThemeSync = () => {
  const mode = useThemeStore((s) => s.mode);
  const prefersDark = useMediaQuery(MEDIA.dark);
  useEffect(() => applyTheme(resolveTheme(mode, prefersDark)), [mode, prefersDark]);
};
