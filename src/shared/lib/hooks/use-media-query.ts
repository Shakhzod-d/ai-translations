import { useSyncExternalStore } from 'react';
import { MEDIA } from '@/shared/config';

export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );

export type Viewport = 'mobile' | 'tablet' | 'desktop';

/** Coarse viewport class for choosing interaction patterns (not for styling — use CSS for that). */
export const useViewport = (): Viewport => {
  const isDesktop = useMediaQuery(MEDIA.desktop);
  const isTablet = useMediaQuery(MEDIA.tablet);
  return isDesktop ? 'desktop' : isTablet ? 'tablet' : 'mobile';
};
