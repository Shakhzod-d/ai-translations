import type { CefrLevel } from '@/shared/config';
import { CEFR_LEVELS } from '@/shared/config';
import { splitSentences } from '@/shared/lib';
import { DICTIONARY, lookup } from './dictionary';

const levelRank = (level: CefrLevel) => CEFR_LEVELS.indexOf(level);

/** Max sentence length (words) per target level; longer sentences are split at commas/conjunctions. */
const MAX_WORDS: Record<CefrLevel, number> = { A1: 10, A2: 14, B1: 20, B2: 28, C1: 40 };

const replaceHardWords = (sentence: string, target: CefrLevel) =>
  sentence.replace(/\p{L}+/gu, (word) => {
    const hit = lookup(word);
    // Only base forms are replaced; inflected forms would need morphology ("demonstrates" ≠ "show").
    if (hit && word.toLowerCase() !== hit.lemma) return word;
    if (!hit?.entry.simple || levelRank(hit.entry.level) <= levelRank(target)) return word;
    const simple = hit.entry.simple;
    return word[0] === word[0]?.toUpperCase() ? simple[0]!.toUpperCase() + simple.slice(1) : simple;
  });

const splitLongSentence = (sentence: string, maxWords: number): string[] => {
  if (sentence.split(/\s+/).length <= maxWords) return [sentence];
  const parts = sentence
    // Split only at coordinating conjunctions: subordinate clauses ("while…") would become fragments.
    .split(/,\s+(?=(?:and|but|so)\b)|;\s+/i)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return [sentence];
  return parts.map((part, i) => {
    let p = part.replace(/^and\s+/i, '');
    p = p[0]!.toUpperCase() + p.slice(1);
    return i === parts.length - 1 || /[.!?]$/.test(p) ? p : `${p}.`;
  });
};

export const simplifyParagraph = (paragraph: string, level: CefrLevel): string =>
  splitSentences(paragraph)
    .flatMap((s) => splitLongSentence(replaceHardWords(s, level), MAX_WORDS[level]))
    .join(' ');

export const estimateLevel = (text: string): CefrLevel => {
  const words = text.match(/\p{L}+/gu) ?? [];
  if (words.length === 0) return 'A1';
  const avgLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const hardRatio =
    words.filter((w) => {
      const entry = lookup(w)?.entry;
      return entry && levelRank(entry.level) >= levelRank('B2');
    }).length / words.length;
  const score = avgLength + hardRatio * 40;
  if (score < 4.2) return 'A2';
  if (score < 4.8) return 'B1';
  if (score < 5.4) return 'B2';
  return 'C1';
};

export { DICTIONARY };
