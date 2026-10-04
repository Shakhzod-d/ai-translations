import { z } from 'zod';
import { CEFR_LEVELS, SUPPORTED_LANGUAGES } from '@/shared/config';

/**
 * API contracts. Every response from the backend is parsed with these schemas,
 * so the UI only ever sees validated, structured data. Domain types are inferred
 * from here and re-exported by the entities layer — never redeclared.
 */

export const languageCodeSchema = z.enum(SUPPORTED_LANGUAGES);
export const cefrLevelSchema = z.enum(CEFR_LEVELS);

export const SUPPORTED_FILE_TYPES = ['pdf', 'txt', 'docx', 'html', 'md'] as const;
export const fileTypeSchema = z.enum(SUPPORTED_FILE_TYPES);

export const localizedTextSchema = z.object({
  en: z.string().optional(),
  uz: z.string().optional(),
  ru: z.string().optional(),
});

export const paragraphSchema = z.object({ id: z.string(), text: z.string() });

export const articleContentSchema = z.object({
  paragraphs: z.array(paragraphSchema),
});

/** Adding a mode = adding a literal here + a renderer registration; the reader stays untouched. */
export const ARTICLE_VERSION_TYPES = ['original', 'simplified', 'summary'] as const;
export const articleVersionTypeSchema = z.enum(ARTICLE_VERSION_TYPES);

export const articleVersionSchema = z.object({
  id: z.string(),
  type: articleVersionTypeSchema,
  level: cefrLevelSchema.optional(),
  language: z.string(),
  content: articleContentSchema,
});

export const articleMetadataSchema = z.object({
  fileName: z.string(),
  fileType: fileTypeSchema,
  fileSize: z.number().nonnegative(),
  wordCount: z.number().nonnegative(),
  readingMinutes: z.number().nonnegative(),
  estimatedLevel: cefrLevelSchema.optional(),
  favorite: z.boolean(),
  lastOpenedAt: z.string().optional(),
  progress: z.number().min(0).max(1).optional(),
});

export const phrasalVerbSchema = z.object({
  phrase: z.string(),
  meaning: z.string(),
  example: z.string(),
  translation: localizedTextSchema.optional(),
});

export const vocabularyItemSchema = z.object({
  id: z.string(),
  word: z.string(),
  phrase: z.string().optional(),
  translation: localizedTextSchema,
  definition: z.string().optional(),
  synonyms: z.array(z.string()).optional(),
  antonyms: z.array(z.string()).optional(),
  examples: z.array(z.string()).optional(),
  level: cefrLevelSchema.optional(),
  sourceDocumentId: z.string().optional(),
  createdAt: z.string(),
});

export const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  originalText: z.string(),
  language: z.string(),
  versions: z.array(articleVersionSchema),
  vocabulary: z.array(vocabularyItemSchema),
  phrasalVerbs: z.array(phrasalVerbSchema),
  metadata: articleMetadataSchema,
  createdAt: z.string(),
});

export const articleSummarySchema = articleSchema
  .pick({
    id: true,
    title: true,
    language: true,
    metadata: true,
    createdAt: true,
  })
  .extend({ availableLevels: z.array(cefrLevelSchema) });

export const PROCESSING_STAGES = [
  'uploading',
  'extracting',
  'analyzing',
  'simplifying',
  'vocabulary',
  'finalizing',
] as const;
export const processingStageSchema = z.enum(PROCESSING_STAGES);

export const processingJobSchema = z.discriminatedUnion('status', [
  z.object({ id: z.string(), status: z.literal('processing'), stage: processingStageSchema }),
  z.object({ id: z.string(), status: z.literal('completed'), articleId: z.string() }),
  z.object({
    id: z.string(),
    status: z.literal('failed'),
    errorCode: z.enum(['EXTRACTION_FAILED', 'EMPTY_DOCUMENT', 'AI_UNAVAILABLE', 'UNKNOWN']),
  }),
]);

export const wordSenseSchema = z.object({
  word: z.string(),
  explanation: z.string(),
  level: cefrLevelSchema.optional(),
});

export const wordAnalysisSchema = z.object({
  query: z.string(),
  lemma: z.string(),
  partOfSpeech: z.string().optional(),
  level: cefrLevelSchema.optional(),
  phonetic: z.string().optional(),
  translation: localizedTextSchema,
  definition: z.string().optional(),
  synonyms: z.array(wordSenseSchema),
  antonyms: z.array(wordSenseSchema),
  examples: z.array(z.string()),
  phrasalVerbs: z.array(phrasalVerbSchema),
});

export const translationSchema = z.object({
  text: z.string(),
  target: languageCodeSchema,
  translatedText: z.string(),
});

export type FileType = z.infer<typeof fileTypeSchema>;
export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type Paragraph = z.infer<typeof paragraphSchema>;
export type ArticleContent = z.infer<typeof articleContentSchema>;
export type ArticleVersionType = z.infer<typeof articleVersionTypeSchema>;
export type ArticleVersion = z.infer<typeof articleVersionSchema>;
export type ArticleMetadata = z.infer<typeof articleMetadataSchema>;
export type PhrasalVerb = z.infer<typeof phrasalVerbSchema>;
export type VocabularyItem = z.infer<typeof vocabularyItemSchema>;
export type Article = z.infer<typeof articleSchema>;
export type ArticleSummary = z.infer<typeof articleSummarySchema>;
export type ProcessingStage = z.infer<typeof processingStageSchema>;
export type ProcessingJob = z.infer<typeof processingJobSchema>;
export type WordSense = z.infer<typeof wordSenseSchema>;
export type WordAnalysis = z.infer<typeof wordAnalysisSchema>;
export type Translation = z.infer<typeof translationSchema>;

export type NewVocabularyItem = Omit<VocabularyItem, 'id' | 'createdAt'>;
export type ArticlePatch = Partial<Pick<Article, 'title'>> & {
  favorite?: boolean;
  progress?: number;
  lastOpenedAt?: string;
};
