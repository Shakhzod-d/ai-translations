import type { FileType } from '@/shared/api';

/**
 * Upload rules. Adding a format (e.g. EPUB) = one entry here + a backend extractor.
 * The extension/MIME check is a UX pre-filter only; the server re-validates file content.
 */
export const FILE_TYPE_RULES: Record<
  FileType,
  { extensions: string[]; mimeTypes: string[]; label: string }
> = {
  pdf: { extensions: ['.pdf'], mimeTypes: ['application/pdf'], label: 'PDF' },
  docx: {
    extensions: ['.docx'],
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    label: 'DOCX',
  },
  txt: { extensions: ['.txt'], mimeTypes: ['text/plain'], label: 'TXT' },
  html: { extensions: ['.html', '.htm'], mimeTypes: ['text/html'], label: 'HTML' },
  md: {
    extensions: ['.md', '.markdown'],
    mimeTypes: ['text/markdown', 'text/x-markdown'],
    label: 'MD',
  },
};

export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ACCEPT_ATTRIBUTE = Object.values(FILE_TYPE_RULES)
  .flatMap((r) => [...r.extensions, ...r.mimeTypes])
  .join(',');

export const SUPPORTED_TYPE_LABELS = Object.values(FILE_TYPE_RULES)
  .map((r) => r.label)
  .join(', ');

export type FileValidationError = 'type' | 'size' | 'empty' | 'tooMany';
export type FileValidationResult =
  { ok: true; file: File; type: FileType } | { ok: false; error: FileValidationError };

export const detectFileType = (fileName: string): FileType | null => {
  const lower = fileName.toLowerCase();
  const match = (
    Object.entries(FILE_TYPE_RULES) as [FileType, (typeof FILE_TYPE_RULES)[FileType]][]
  ).find(([, rule]) => rule.extensions.some((ext) => lower.endsWith(ext)));
  return match?.[0] ?? null;
};

export const validateFiles = (files: File[]): FileValidationResult => {
  if (files.length !== 1) return { ok: false, error: 'tooMany' };
  const file = files[0]!;
  const type = detectFileType(file.name);
  // Extension is required; MIME is checked only when the browser provides one, since it is unreliable.
  if (
    !type ||
    (file.type &&
      !FILE_TYPE_RULES[type].mimeTypes.includes(file.type) &&
      !file.type.startsWith('text/'))
  ) {
    return { ok: false, error: 'type' };
  }
  if (file.size === 0) return { ok: false, error: 'empty' };
  if (file.size > MAX_FILE_SIZE_BYTES) return { ok: false, error: 'size' };
  return { ok: true, file, type };
};
