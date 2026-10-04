import { z } from 'zod';
import { CEFR_LEVELS, STORAGE_KEYS, type CefrLevel } from '@/shared/config';
import {
  countWords,
  createId,
  estimateReadingMinutes,
  idb,
  normalizeWord,
  requestPersistentStorage,
  splitParagraphs,
  safeStorage,
} from '@/shared/lib';
import { isAiConfigured } from '../ai/ai-settings';
import {
  analyzeDocument,
  analyzeWordWithAi,
  simplifyParagraphs,
  translateWithAi,
} from '../ai/tasks';
import {
  articleSchema,
  vocabularyItemSchema,
  wordAnalysisSchema,
  type Article,
  type ArticleSummary,
  type ArticleVersion,
  type FileType,
  type ProcessingJob,
  type ProcessingStage,
} from '../contracts';
import { ApiError } from '../errors';
import { ExtractionError, extractText } from '../extraction/extract';
import { detectPhrasalVerbs } from '../mock/dictionary';
import { estimateLevel } from '../mock/simplify';
import type { ArticlesApi, VocabularyApi } from '../types';

/**
 * Serverless adapter: documents, original files and vocabulary live in IndexedDB;
 * AI work goes directly from the browser to Claude with the user's own key.
 * Same contracts as the HTTP API, so a backend can replace it later with no UI changes.
 */

/** Generated on upload so the reader opens with a useful simplified version immediately. */
const INITIAL_LEVEL: CefrLevel = 'B1';

interface StoredFile {
  name: string;
  type: string;
  blob: Blob;
}

const parseArticle = (value: unknown) => {
  const parsed = articleSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

const toSummary = (a: Article): ArticleSummary => ({
  id: a.id,
  title: a.title,
  language: a.language,
  metadata: a.metadata,
  createdAt: a.createdAt,
  availableLevels: a.versions.flatMap((v) => (v.level ? [v.level] : [])),
});

const versionId = (level: CefrLevel) => `simplified-${level.toLowerCase()}`;
const paragraphId = (articleId: string, i: number) => `${articleId}-p${i}`;

const buildVersion = (
  articleId: string,
  paragraphs: string[],
  level?: CefrLevel,
): ArticleVersion => ({
  id: level ? versionId(level) : 'original',
  type: level ? 'simplified' : 'original',
  level,
  language: 'en',
  content: { paragraphs: paragraphs.map((text, i) => ({ id: paragraphId(articleId, i), text })) },
});

const sortVersions = (versions: ArticleVersion[]) =>
  [...versions].sort(
    (a, b) =>
      (a.level ? CEFR_LEVELS.indexOf(a.level) : -1) - (b.level ? CEFR_LEVELS.indexOf(b.level) : -1),
  );

const aiCacheKey = (...parts: string[]) => parts.join('\u0000');

/** Persistent cache: the same word/translation is never paid for twice. */
const cached = async <S extends z.ZodType>(
  key: string,
  schema: S,
  compute: () => Promise<z.infer<S>>,
): Promise<z.infer<S>> => {
  const hit = schema.safeParse(await idb.get('aiCache', key).catch(() => undefined));
  if (hit.success) return hit.data;
  const value = await compute();
  await idb.set('aiCache', key, value).catch(() => undefined);
  return value;
};

export const createLocalApis = (): { articles: ArticlesApi; vocabulary: VocabularyApi } => {
  const jobs = new Map<string, ProcessingJob>();
  void requestPersistentStorage();
  // Data from the development mock is not migrated.
  safeStorage.remove(STORAGE_KEYS.mockDb);

  const getArticle = async (id: string) => {
    const article = parseArticle(await idb.get('articles', id));
    if (!article) throw new ApiError('NOT_FOUND', { status: 404 });
    return article;
  };
  const saveArticle = (article: Article) => idb.set('articles', article.id, article);

  const processFile = async (jobId: string, file: File) => {
    const setStage = (stage: ProcessingStage) =>
      jobs.set(jobId, { id: jobId, status: 'processing', stage });
    try {
      setStage('extracting');
      const { text, type } = await extractText(file);
      const paragraphs = splitParagraphs(text);
      const id = createId('art');
      const wordCount = countWords(text);

      // Heuristic defaults; replaced by AI results when a key is configured.
      let title =
        paragraphs[0] && paragraphs[0].length < 90
          ? paragraphs[0]
          : file.name.replace(/\.[^.]+$/, '');
      let language = 'en';
      let level = estimateLevel(text);
      let phrasalVerbs = detectPhrasalVerbs(text);
      const versions = [buildVersion(id, paragraphs)];

      if (isAiConfigured()) {
        // AI failures never lose the document: it is saved with what succeeded,
        // and missing versions can be generated later from the reader.
        setStage('analyzing');
        try {
          const analysis = await analyzeDocument(text, file.name);
          ({ title, language, level, phrasalVerbs } = analysis);
        } catch (error) {
          console.error('[ai] document analysis failed', error);
        }
        setStage('simplifying');
        try {
          versions.push(
            buildVersion(id, await simplifyParagraphs(paragraphs, INITIAL_LEVEL), INITIAL_LEVEL),
          );
        } catch (error) {
          console.error('[ai] simplification failed', error);
        }
      }

      setStage('vocabulary');
      const article: Article = {
        id,
        title,
        originalText: text,
        language,
        versions,
        vocabulary: [],
        phrasalVerbs,
        metadata: {
          fileName: file.name,
          fileType: type satisfies FileType,
          fileSize: file.size,
          wordCount,
          readingMinutes: estimateReadingMinutes(wordCount),
          estimatedLevel: level,
          favorite: false,
          progress: 0,
        },
        createdAt: new Date().toISOString(),
      };

      setStage('finalizing');
      await idb.set('files', id, {
        name: file.name,
        type: file.type,
        blob: file,
      } satisfies StoredFile);
      await saveArticle(article);
      jobs.set(jobId, { id: jobId, status: 'completed', articleId: id });
    } catch (error) {
      console.error('[upload] processing failed', error);
      const errorCode = error instanceof ExtractionError ? error.code : 'UNKNOWN';
      jobs.set(jobId, { id: jobId, status: 'failed', errorCode });
    }
  };

  const articles: ArticlesApi = {
    async listArticles() {
      const all = (await idb.getAll('articles')).flatMap((a) => parseArticle(a) ?? []);
      return all.map(toSummary).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    getArticle: (id) => getArticle(id),
    async uploadArticle(file, options) {
      if (options?.signal?.aborted) throw new ApiError('ABORTED');
      // Files never leave the device, so "upload" is reading into memory.
      options?.onProgress?.(1);
      const jobId = createId('job');
      jobs.set(jobId, { id: jobId, status: 'processing', stage: 'uploading' });
      void processFile(jobId, file);
      return jobs.get(jobId)!;
    },
    async getProcessingJob(jobId) {
      const job = jobs.get(jobId);
      if (!job) throw new ApiError('NOT_FOUND', { status: 404 });
      return job;
    },
    async updateArticle(id, patch) {
      const article = await getArticle(id);
      if (patch.title !== undefined) article.title = patch.title;
      if (patch.favorite !== undefined) article.metadata.favorite = patch.favorite;
      if (patch.progress !== undefined) article.metadata.progress = patch.progress;
      if (patch.lastOpenedAt !== undefined) article.metadata.lastOpenedAt = patch.lastOpenedAt;
      await saveArticle(article);
      return toSummary(article);
    },
    async deleteArticle(id) {
      await getArticle(id);
      await Promise.all([idb.delete('articles', id), idb.delete('files', id)]);
    },
    async generateVersion(articleId, level) {
      const article = await getArticle(articleId);
      const existing = article.versions.find((v) => v.level === level);
      if (existing) return existing;
      const original = article.versions.find((v) => v.type === 'original');
      const paragraphs =
        original?.content.paragraphs.map((p) => p.text) ?? splitParagraphs(article.originalText);
      const version = buildVersion(article.id, await simplifyParagraphs(paragraphs, level), level);
      // Re-read: another generation may have finished meanwhile.
      const latest = await getArticle(articleId);
      latest.versions = sortVersions([
        ...latest.versions.filter((v) => v.id !== version.id),
        version,
      ]);
      await saveArticle(latest);
      return version;
    },
    async translateText(text, target, signal, context) {
      if (target === 'en' && /^[\p{Script=Latin}\s\p{P}\d]+$/u.test(text))
        return { text, target, translatedText: text };
      const translatedText = await cached(aiCacheKey('tr', target, text), z.string(), () =>
        translateWithAi(text, target, context, signal),
      );
      return { text, target, translatedText };
    },
    analyzeWord: (word, context, signal) =>
      cached(aiCacheKey('word', normalizeWord(word)), wordAnalysisSchema, () =>
        analyzeWordWithAi(word, context, signal),
      ),
  };

  const vocabulary: VocabularyApi = {
    async listWords() {
      return (await idb.getAll('vocabulary')).flatMap((v) => {
        const parsed = vocabularyItemSchema.safeParse(v);
        return parsed.success ? [parsed.data] : [];
      });
    },
    async saveWord(item) {
      const existing = (await vocabulary.listWords()).find(
        (v) => normalizeWord(v.word) === normalizeWord(item.word),
      );
      if (existing) return existing;
      const saved = { ...item, id: createId('voc'), createdAt: new Date().toISOString() };
      await idb.set('vocabulary', saved.id, saved);
      return saved;
    },
    async deleteWord(id) {
      await idb.delete('vocabulary', id);
    },
  };

  return { articles, vocabulary };
};
