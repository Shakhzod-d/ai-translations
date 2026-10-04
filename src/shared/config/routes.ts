export const ROUTES = {
  home: '/',
  documents: '/documents',
  reader: '/reader/:articleId',
  vocabulary: '/vocabulary',
  settings: '/settings',
} as const;

export const buildReaderPath = (articleId: string, versionId?: string) =>
  `/reader/${encodeURIComponent(articleId)}${versionId ? `?v=${encodeURIComponent(versionId)}` : ''}`;
