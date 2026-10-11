import { z } from 'zod';
import type { LanguageCode } from '@/shared/config';
import { runStructured } from './run-structured';

export type WordTranslations = Record<LanguageCode, string>;

const schema = z.object({
  items: z.array(z.object({ word: z.string(), en: z.string(), uz: z.string(), ru: z.string() })),
});

/** Small batches keep every word aligned and each call far below output limits. */
const BATCH_SIZE = 80;
const PARALLEL_BATCHES = 3;

const translateBatch = async (words: string[], sourceLanguage: string, signal?: AbortSignal) => {
  const { items } = await runStructured({
    system:
      'You are a lexicographer preparing a bilingual frequency dictionary for corpus-linguistics research. ' +
      'Uzbek must use the official Latin alphabet with the ʻ (U+02BB) character, e.g. "oʻqish". Russian must be natural.',
    effort: 'low',
    signal,
    schema,
    prompt: `Translate each ${sourceLanguage} word form below into English (en), Uzbek (uz) and Russian (ru).
The words come from a word-frequency list, so they appear without context: give the most common meaning of that exact form,
as a short dictionary gloss (1–4 words; separate two very different meanings with "; "). For grammatical words, give the usual equivalent
(e.g. Swahili "na" → "and; with"). For proper names, keep the name. Return one item per input word, in the same order, with "word" copied exactly.

${words.map((w, i) => `${i + 1}. ${w}`).join('\n')}`,
  });
  const byWord = new Map(items.map((item) => [item.word.trim().toLocaleLowerCase(), item]));
  return words.map((word, i) => {
    // Prefer an exact match; fall back to position when the model altered the echoed word.
    const item = byWord.get(word) ?? items[i];
    return [word, { en: item?.en ?? '', uz: item?.uz ?? '', ru: item?.ru ?? '' }] as const;
  });
};

/** Translates a word list into en/uz/ru, reporting progress after every batch. */
export const translateWordList = async (
  words: string[],
  {
    sourceLanguage = 'Swahili',
    signal,
    onProgress,
  }: { sourceLanguage?: string; signal?: AbortSignal; onProgress?: (done: number) => void } = {},
): Promise<Map<string, WordTranslations>> => {
  const batches: string[][] = [];
  for (let i = 0; i < words.length; i += BATCH_SIZE) batches.push(words.slice(i, i + BATCH_SIZE));

  const result = new Map<string, WordTranslations>();
  for (let start = 0; start < batches.length; start += PARALLEL_BATCHES) {
    const slice = batches.slice(start, start + PARALLEL_BATCHES);
    const done = await Promise.all(slice.map((b) => translateBatch(b, sourceLanguage, signal)));
    done.flat().forEach(([word, t]) => result.set(word, t));
    onProgress?.(result.size);
  }
  return result;
};
