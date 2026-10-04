/** Mirrors the Tailwind breakpoints declared in app/styles/index.css. */
export const BREAKPOINTS = {
  tablet: 640,
  desktop: 1024,
  wide: 1440,
} as const;

export const MEDIA = {
  tablet: `(min-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  wide: `(min-width: ${BREAKPOINTS.wide}px)`,
  reducedMotion: '(prefers-reduced-motion: reduce)',
  dark: '(prefers-color-scheme: dark)',
} as const;
