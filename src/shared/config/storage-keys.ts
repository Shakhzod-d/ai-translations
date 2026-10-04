/** Single source of truth for persisted keys (also read by the no-flash script in index.html). */
export const STORAGE_KEYS = {
  theme: 'lr.theme',
  language: 'lr.language',
  readerPreferences: 'lr.reader-preferences',
  mockDb: 'lr.mock-db',
} as const;
