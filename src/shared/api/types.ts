import type {
  Article,
  ArticlePatch,
  ArticleSummary,
  ArticleVersion,
  ExerciseSet,
  NewVocabularyItem,
  ProcessingJob,
  TextImport,
  Translation,
  VocabularyItem,
  WordAnalysis,
} from './contracts';
import type { CefrLevel, LanguageCode } from '@/shared/config';

export interface UploadOptions {
  signal?: AbortSignal;
  onProgress?: (ratio: number) => void;
}

/** Transport-agnostic API surface. Implemented by the HTTP adapter and the dev mock. */
export interface ArticlesApi {
  listArticles(signal?: AbortSignal): Promise<ArticleSummary[]>;
  getArticle(id: string, signal?: AbortSignal): Promise<Article>;
  uploadArticle(file: File, options?: UploadOptions): Promise<ProcessingJob>;
  /** Same processing pipeline as a file upload, for pasted text. */
  importText(input: TextImport, signal?: AbortSignal): Promise<ProcessingJob>;
  getProcessingJob(jobId: string, signal?: AbortSignal): Promise<ProcessingJob>;
  updateArticle(id: string, patch: ArticlePatch): Promise<ArticleSummary>;
  deleteArticle(id: string): Promise<void>;
  generateVersion(articleId: string, level: CefrLevel): Promise<ArticleVersion>;
  /** Creates (or replaces) the exercise set for that level. */
  generateExercises(articleId: string, level: CefrLevel): Promise<ExerciseSet>;
  translateText(
    text: string,
    target: LanguageCode,
    signal?: AbortSignal,
    context?: string,
  ): Promise<Translation>;
  analyzeWord(
    word: string,
    context: string | undefined,
    signal?: AbortSignal,
  ): Promise<WordAnalysis>;
}

export interface VocabularyApi {
  listWords(signal?: AbortSignal): Promise<VocabularyItem[]>;
  saveWord(item: NewVocabularyItem): Promise<VocabularyItem>;
  deleteWord(id: string): Promise<void>;
}
