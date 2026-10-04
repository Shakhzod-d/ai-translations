export const SUPPORTED_LANGUAGES = ['en', 'uz', 'ru'] as const;
export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const LANGUAGE_NATIVE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  uz: 'Oʻzbekcha',
  ru: 'Русский',
};

export const isLanguageCode = (value: unknown): value is LanguageCode =>
  typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];
