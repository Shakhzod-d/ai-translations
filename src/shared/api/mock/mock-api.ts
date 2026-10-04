import { z } from 'zod';
import type { CefrLevel, LanguageCode } from '@/shared/config';
import { CEFR_LEVELS, STORAGE_KEYS } from '@/shared/config';
import {
  countWords,
  createId,
  estimateReadingMinutes,
  safeStorage,
  splitParagraphs,
} from '@/shared/lib';
import {
  articleSchema,
  vocabularyItemSchema,
  type Article,
  type ArticleSummary,
  type ArticleVersion,
  type FileType,
  type ProcessingJob,
  type ProcessingStage,
  type WordAnalysis,
} from '../contracts';
import { ApiError } from '../errors';
import type { ArticlesApi, VocabularyApi } from '../types';
import { detectPhrasalVerbs, lookup, PHRASAL_VERBS } from './dictionary';
import { ExtractionError, extractText } from '../extraction/extract';
import { SEED_ARTICLE } from './seed';
import { estimateLevel, simplifyParagraph } from './simplify';

/**
 * In-browser stand-in for the backend. It exists so the frontend can be developed
 * and demoed without secrets. It honours the exact same contracts as the HTTP API.
 */

const dbSchema = z.object({
  articles: z.array(articleSchema),
  vocabulary: z.array(vocabularyItemSchema),
});
type Db = z.infer<typeof dbSchema>;

const LATENCY_MS = 250;
const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new ApiError('ABORTED'));
      },
      { once: true },
    );
  });

const buildVersion = (
  articleId: string,
  paragraphs: string[],
  level?: CefrLevel,
): ArticleVersion => ({
  id: level ? `simplified-${level.toLowerCase()}` : 'original',
  type: level ? 'simplified' : 'original',
  level,
  language: 'en',
  content: {
    paragraphs: paragraphs.map((text, i) => ({
      id: `${articleId}-p${i}`,
      text: level ? simplifyParagraph(text, level) : text,
    })),
  },
});

const DEFAULT_LEVELS: CefrLevel[] = ['B1'];

const buildArticle = (
  text: string,
  fileName: string,
  fileType: FileType,
  fileSize: number,
  title?: string,
): Article => {
  const id = createId('art');
  const paragraphs = splitParagraphs(text);
  const wordCount = countWords(text);
  const now = new Date().toISOString();
  return {
    id,
    title:
      title ??
      (paragraphs[0]?.length && paragraphs[0].length < 90
        ? paragraphs[0]
        : fileName.replace(/\.[^.]+$/, '')),
    originalText: text,
    language: 'en',
    versions: [
      buildVersion(id, paragraphs),
      ...DEFAULT_LEVELS.map((l) => buildVersion(id, paragraphs, l)),
    ],
    vocabulary: [],
    phrasalVerbs: detectPhrasalVerbs(text),
    metadata: {
      fileName,
      fileType,
      fileSize,
      wordCount,
      readingMinutes: estimateReadingMinutes(wordCount),
      estimatedLevel: estimateLevel(text),
      favorite: false,
      progress: 0,
    },
    createdAt: now,
  };
};

const toSummary = (a: Article): ArticleSummary => ({
  id: a.id,
  title: a.title,
  language: a.language,
  metadata: a.metadata,
  createdAt: a.createdAt,
  availableLevels: a.versions.flatMap((v) => (v.level ? [v.level] : [])),
});

export const createMockApis = ({ latency = LATENCY_MS, persist = true } = {}): {
  articles: ArticlesApi;
  vocabulary: VocabularyApi;
} => {
  const load = (): Db => {
    const raw = persist ? safeStorage.get(STORAGE_KEYS.mockDb) : null;
    if (raw) {
      try {
        const parsed = dbSchema.safeParse(JSON.parse(raw));
        if (parsed.success) return parsed.data;
      } catch {
        // corrupted storage: fall through to seed
      }
    }
    const seed = buildArticle(
      SEED_ARTICLE.text,
      SEED_ARTICLE.fileName,
      'md',
      SEED_ARTICLE.text.length,
      SEED_ARTICLE.title,
    );
    return { articles: [seed], vocabulary: [] };
  };

  const db = load();
  const save = () => persist && safeStorage.set(STORAGE_KEYS.mockDb, JSON.stringify(db));
  // Persist the seed immediately so its id stays stable across reloads.
  save();
  const jobs = new Map<string, ProcessingJob>();
  const wait = (signal?: AbortSignal) => delay(latency, signal);

  const findArticle = (id: string) => {
    const article = db.articles.find((a) => a.id === id);
    if (!article) throw new ApiError('NOT_FOUND', { status: 404 });
    return article;
  };

  const runJob = async (jobId: string, file: File) => {
    const setStage = (stage: ProcessingStage) =>
      jobs.set(jobId, { id: jobId, status: 'processing', stage });
    try {
      setStage('extracting');
      const { text, type } = await extractText(file);
      for (const stage of ['analyzing', 'simplifying', 'vocabulary', 'finalizing'] as const) {
        await delay(latency * 2);
        setStage(stage);
      }
      const article = buildArticle(text, file.name, type, file.size);
      db.articles.unshift(article);
      save();
      jobs.set(jobId, { id: jobId, status: 'completed', articleId: article.id });
    } catch (error) {
      jobs.set(jobId, {
        id: jobId,
        status: 'failed',
        errorCode: error instanceof ExtractionError ? error.code : 'UNKNOWN',
      });
    }
  };

  const articles: ArticlesApi = {
    async listArticles(signal) {
      await wait(signal);
      return db.articles.map(toSummary);
    },
    async getArticle(id, signal) {
      await wait(signal);
      return structuredClone(findArticle(id));
    },
    async uploadArticle(file, options) {
      const steps = 10;
      for (let i = 1; i <= steps; i++) {
        await delay(latency / 3, options?.signal);
        options?.onProgress?.(i / steps);
      }
      const jobId = createId('job');
      jobs.set(jobId, { id: jobId, status: 'processing', stage: 'uploading' });
      void runJob(jobId, file);
      return jobs.get(jobId)!;
    },
    async getProcessingJob(jobId, signal) {
      await delay(latency / 2, signal);
      const job = jobs.get(jobId);
      if (!job) throw new ApiError('NOT_FOUND', { status: 404 });
      return job;
    },
    async updateArticle(id, patch) {
      await wait();
      const article = findArticle(id);
      if (patch.title !== undefined) article.title = patch.title;
      if (patch.favorite !== undefined) article.metadata.favorite = patch.favorite;
      if (patch.progress !== undefined) article.metadata.progress = patch.progress;
      if (patch.lastOpenedAt !== undefined) article.metadata.lastOpenedAt = patch.lastOpenedAt;
      save();
      return toSummary(article);
    },
    async deleteArticle(id) {
      await wait();
      findArticle(id);
      db.articles = db.articles.filter((a) => a.id !== id);
      save();
    },
    async generateVersion(articleId, level) {
      await delay(latency * 4);
      const article = findArticle(articleId);
      const existing = article.versions.find((v) => v.level === level);
      if (existing) return existing;
      const version = buildVersion(article.id, splitParagraphs(article.originalText), level);
      article.versions.push(version);
      article.versions.sort(
        (a, b) =>
          (a.level ? CEFR_LEVELS.indexOf(a.level) : -1) -
          (b.level ? CEFR_LEVELS.indexOf(b.level) : -1),
      );
      save();
      return version;
    },
    async translateText(text, target: LanguageCode, signal) {
      await wait(signal);
      const words = text.split(/(\s+)/);
      const translated = words
        .map((w) => {
          const hit = lookup(w.replace(/[^\p{L}]/gu, ''));
          return hit?.entry.translation[target] ?? w;
        })
        .join('');
      return { text, target, translatedText: target === 'en' ? text : translated };
    },
    async analyzeWord(word, context, signal) {
      await wait(signal);
      const query = word.trim();
      const phrasal = PHRASAL_VERBS.filter(
        (pv) =>
          pv.phrase.includes(query.toLowerCase()) ||
          (context ?? '').toLowerCase().includes(pv.phrase),
      );
      const hit = lookup(query);
      if (!hit) {
        const unknown: WordAnalysis = {
          query,
          lemma: query.toLowerCase(),
          translation: {},
          synonyms: [],
          antonyms: [],
          examples: context ? [context] : [],
          phrasalVerbs: phrasal.filter((pv) =>
            pv.phrase.split(' ')[0]?.startsWith(query.toLowerCase().slice(0, 3)),
          ),
        };
        return unknown;
      }
      const { entry, lemma } = hit;
      return {
        query,
        lemma,
        partOfSpeech: entry.partOfSpeech,
        level: entry.level,
        phonetic: entry.phonetic,
        translation: entry.translation,
        definition: entry.definition,
        synonyms: entry.synonyms,
        antonyms: entry.antonyms,
        examples: entry.examples,
        phrasalVerbs: [],
      };
    },
  };

  const vocabulary: VocabularyApi = {
    async listWords(signal) {
      await wait(signal);
      return [...db.vocabulary];
    },
    async saveWord(item) {
      await wait();
      const duplicate = db.vocabulary.find((v) => v.word.toLowerCase() === item.word.toLowerCase());
      if (duplicate) return duplicate;
      const saved = { ...item, id: createId('voc'), createdAt: new Date().toISOString() };
      db.vocabulary.unshift(saved);
      save();
      return saved;
    },
    async deleteWord(id) {
      await wait();
      db.vocabulary = db.vocabulary.filter((v) => v.id !== id);
      save();
    },
  };

  return { articles, vocabulary };
};
