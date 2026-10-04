import { z } from 'zod';
import { CEFR_LEVELS, type CefrLevel, type LanguageCode } from '@/shared/config';
import { LANGUAGE_NATIVE_NAMES } from '@/shared/config';
import type { PhrasalVerb, WordAnalysis } from '../contracts';
import { runStructured } from './run-structured';

const level = z.enum(CEFR_LEVELS);
const translations = z.object({ en: z.string(), uz: z.string(), ru: z.string() });

const TUTOR =
  'You are an expert English teacher and lexicographer helping learners whose native languages are Uzbek and Russian. ' +
  'Uzbek must use the official Latin alphabet with the ʻ (U+02BB) character, e.g. "oʻqish". Russian must be natural and idiomatic.';

/** Document text beyond this is not needed to judge title, level and phrasal verbs. */
const ANALYSIS_SAMPLE_CHARS = 24_000;

const documentAnalysisSchema = z.object({
  title: z.string(),
  language: z.string(),
  level,
  phrasalVerbs: z.array(
    z.object({
      phrase: z.string(),
      meaning: z.string(),
      example: z.string(),
      translation: translations,
    }),
  ),
});

export const analyzeDocument = async (text: string, fileName: string, signal?: AbortSignal) =>
  runStructured({
    system: TUTOR,
    effort: 'low',
    signal,
    schema: documentAnalysisSchema,
    prompt: `Analyze this document (file name: "${fileName}").
Return:
- title: the document's real title if it has one, otherwise a concise descriptive title (max 80 chars), in the document's language.
- language: ISO 639-1 code of the document's language.
- level: the CEFR level a reader needs to understand it comfortably.
- phrasalVerbs: up to 12 phrasal verbs that actually occur in the text (any inflection), most useful first, using the base form (e.g. "figure out"). "example" must be a sentence quoted from the document. Return an empty list if there are none.

<document>
${text.slice(0, ANALYSIS_SAMPLE_CHARS)}
</document>`,
  });

const LEVEL_GUIDE: Record<CefrLevel, string> = {
  A1: 'very short sentences (max ~8 words), only the most common 1000 words, present tense where possible',
  A2: 'short sentences (max ~12 words), common everyday vocabulary, simple past and future',
  B1: 'clear sentences (max ~18 words), common vocabulary; explain or replace rare words and idioms',
  B2: 'natural sentences; replace only rare, technical or idiomatic expressions',
  C1: 'keep nuance and style; only clarify very rare words and convoluted syntax',
};

const simplifiedSchema = z.object({ paragraphs: z.array(z.string()) });
/** Paragraph batches keep each call well inside output limits and allow parallelism. */
const MAX_WORDS_PER_BATCH = 1800;
const PARALLEL_BATCHES = 3;

const batchParagraphs = (paragraphs: string[]) => {
  const batches: string[][] = [];
  let current: string[] = [];
  let words = 0;
  for (const p of paragraphs) {
    const count = p.split(/\s+/).length;
    if (current.length && words + count > MAX_WORDS_PER_BATCH) {
      batches.push(current);
      current = [];
      words = 0;
    }
    current.push(p);
    words += count;
  }
  if (current.length) batches.push(current);
  return batches;
};

const simplifyBatch = async (
  batch: string[],
  target: CefrLevel,
  signal?: AbortSignal,
): Promise<string[]> => {
  const { paragraphs } = await runStructured({
    system: TUTOR,
    effort: 'medium',
    signal,
    schema: simplifiedSchema,
    prompt: `Rewrite each paragraph for an English learner at CEFR ${target}: ${LEVEL_GUIDE[target]}.
Keep every fact and the original meaning; do not add commentary, headings or explanations about the rewrite.
Return exactly ${batch.length} paragraphs, in the same order, one output paragraph per input paragraph.

${batch.map((p, i) => `<paragraph index="${i}">\n${p}\n</paragraph>`).join('\n')}`,
  });
  // Keep paragraphs aligned for side-by-side comparison even if the model merged or split one.
  return batch.map((original, i) => paragraphs[i]?.trim() || original);
};

export const simplifyParagraphs = async (
  paragraphs: string[],
  target: CefrLevel,
  signal?: AbortSignal,
) => {
  const batches = batchParagraphs(paragraphs);
  const results: string[][] = new Array(batches.length);
  for (let start = 0; start < batches.length; start += PARALLEL_BATCHES) {
    const slice = batches.slice(start, start + PARALLEL_BATCHES);
    const done = await Promise.all(slice.map((b) => simplifyBatch(b, target, signal)));
    done.forEach((r, i) => (results[start + i] = r));
  }
  return results.flat();
};

const sense = z.object({ word: z.string(), explanation: z.string(), level });
const wordSchema = z.object({
  lemma: z.string(),
  partOfSpeech: z.string(),
  level,
  phonetic: z.string(),
  translation: translations,
  definition: z.string(),
  synonyms: z.array(sense),
  antonyms: z.array(sense),
  examples: z.array(z.string()),
  phrasalVerbs: z.array(
    z.object({
      phrase: z.string(),
      meaning: z.string(),
      example: z.string(),
      translation: translations,
    }),
  ),
});

/** Long paragraphs are trimmed: the surrounding sentence is enough to disambiguate meaning. */
const MAX_CONTEXT_CHARS = 700;

export const analyzeWordWithAi = async (
  word: string,
  context: string | undefined,
  signal?: AbortSignal,
): Promise<WordAnalysis> => {
  const result = await runStructured({
    system: TUTOR,
    effort: 'low',
    signal,
    schema: wordSchema,
    prompt: `Explain "${word}" for an English learner${context ? ', in the sense used in the context below' : ''}.
- lemma: dictionary form. phonetic: IPA in slashes. level: CEFR level of this word/sense.
- translation: the meaning in English (a short gloss), Uzbek and Russian.
- definition: one short, simple English sentence.
- synonyms: up to 5, most useful first. antonyms: only natural ones — return an empty list rather than forcing one.
- examples: 2 short natural sentences (not copied from the context).
- phrasalVerbs: if "${word}" is or belongs to a phrasal verb (in the context or commonly), list it/them; otherwise empty.
${context ? `\n<context>\n${context.slice(0, MAX_CONTEXT_CHARS)}\n</context>` : ''}`,
  });
  return { query: word, ...result, phonetic: result.phonetic || undefined };
};

export const translateWithAi = async (
  text: string,
  target: LanguageCode,
  context: string | undefined,
  signal?: AbortSignal,
) => {
  const { translation } = await runStructured({
    system: TUTOR,
    effort: 'low',
    signal,
    schema: z.object({ translation: z.string() }),
    prompt: `Translate the text into ${LANGUAGE_NATIVE_NAMES[target]} (${target}). Translate meaning, not word-by-word. Return only the translation.
<text>
${text}
</text>${context ? `\n<surrounding_context>\n${context.slice(0, MAX_CONTEXT_CHARS)}\n</surrounding_context>` : ''}`,
  });
  return translation;
};

export type { PhrasalVerb };
