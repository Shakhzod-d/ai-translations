import type { CSSProperties } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { STORAGE_KEYS, type LanguageCode } from '@/shared/config';

export const CONTENT_WIDTHS = ['narrow', 'medium', 'wide'] as const;
export const FONT_FAMILIES = ['serif', 'sans'] as const;
export type ContentWidth = (typeof CONTENT_WIDTHS)[number];
export type ReaderFont = (typeof FONT_FAMILIES)[number];

export const FONT_SIZE_RANGE = { min: 14, max: 26, step: 1 } as const;
export const LINE_HEIGHT_RANGE = { min: 1.4, max: 2.2, step: 0.1 } as const;

export interface ReaderPreferences {
  fontSize: number;
  lineHeight: number;
  contentWidth: ContentWidth;
  fontFamily: ReaderFont;
  translationLanguage: LanguageCode;
}

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  fontSize: 18,
  lineHeight: 1.75,
  contentWidth: 'medium',
  fontFamily: 'serif',
  translationLanguage: 'ru',
};

interface ReaderPreferencesState extends ReaderPreferences {
  update: (patch: Partial<ReaderPreferences>) => void;
  reset: () => void;
}

export const useReaderPreferences = create<ReaderPreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_READER_PREFERENCES,
      update: (patch) => set(patch),
      reset: () => set(DEFAULT_READER_PREFERENCES),
    }),
    {
      name: STORAGE_KEYS.readerPreferences,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

const WIDTH_CH: Record<ContentWidth, string> = { narrow: '58ch', medium: '68ch', wide: '82ch' };

/** CSS custom properties consumed by the reader typography (see .reader-prose in index.css). */
export const toReaderStyle = (
  p: Pick<ReaderPreferences, 'fontSize' | 'lineHeight' | 'contentWidth' | 'fontFamily'>,
): CSSProperties =>
  ({
    '--reader-font-size': `${p.fontSize}px`,
    '--reader-line-height': p.lineHeight,
    '--reader-width': WIDTH_CH[p.contentWidth],
    '--reader-font': p.fontFamily === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)',
  }) as CSSProperties;
