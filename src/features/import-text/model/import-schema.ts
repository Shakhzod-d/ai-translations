import { z } from 'zod';
import { CEFR_LEVELS } from '@/shared/config';
import { countWords } from '@/shared/lib';

export const MIN_WORDS = 30;
export const MAX_WORDS = 5000;

/** Error messages are i18n keys; the form translates them. */
export const importTextSchema = z.object({
  text: z
    .string()
    .refine((v) => countWords(v) >= MIN_WORDS, 'import.tooShort')
    .refine((v) => countWords(v) <= MAX_WORDS, 'import.tooLong'),
  title: z.string().trim().max(200, 'documents.titleTooLong'),
  source: z.string().trim().max(200),
  level: z.enum(CEFR_LEVELS),
  withExercises: z.boolean(),
});
export type ImportTextValues = z.infer<typeof importTextSchema>;

/** A2 by default: the app's main audience is school learners reading authentic texts. */
export const DEFAULT_IMPORT_VALUES: ImportTextValues = {
  text: '',
  title: '',
  source: '',
  level: 'A2',
  withExercises: true,
};

/** Corpora of authentic English with free online search; offered as quick source picks. */
export const CORPORA = [
  { name: 'BNC', url: 'https://www.english-corpora.org/bnc/' },
  { name: 'COCA', url: 'https://www.english-corpora.org/coca/' },
] as const;
