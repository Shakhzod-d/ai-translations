import { normalizeWord, tokenize } from './tokenize';

export interface WordFrequency {
  rank: number;
  word: string;
  count: number;
  /** Share of all counted tokens, in percent. */
  percent: number;
}

export interface FrequencyOptions {
  minLength?: number;
  /** Words (already lower-cased) left out of the table, e.g. function words. */
  exclude?: ReadonlySet<string>;
}

export interface FrequencyResult {
  /** All word tokens in the text, before filtering. */
  totalTokens: number;
  uniqueWords: number;
  rows: WordFrequency[];
}

/**
 * Most frequent first; ties are alphabetical so the table is reproducible across runs.
 * Words that tie share a rank (standard competition ranking: 1, 2, 2, 4).
 */
export const computeWordFrequency = (
  text: string,
  { minLength = 1, exclude }: FrequencyOptions = {},
): FrequencyResult => {
  const counts = new Map<string, number>();
  let totalTokens = 0;
  for (const token of tokenize(text)) {
    if (token.kind !== 'word') continue;
    totalTokens++;
    const word = normalizeWord(token.value);
    if ([...word].length < minLength || exclude?.has(word)) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }

  const sorted = [...counts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b));
  const rows: WordFrequency[] = [];
  sorted.forEach(([word, count], i) => {
    const prev = rows[i - 1];
    rows.push({
      rank: prev && prev.count === count ? prev.rank : i + 1,
      word,
      count,
      percent: totalTokens ? (count / totalTokens) * 100 : 0,
    });
  });
  return { totalTokens, uniqueWords: counts.size, rows };
};

/** High-frequency Swahili function words, for an optional "content words only" view. */
export const SWAHILI_STOPWORDS: ReadonlySet<string> = new Set(
  `na ya wa za la cha vya kwa ni katika kuwa hii huo hiyo hizo hilo huu ile yake wake zake
   lake chake vyake wao yao zao lao kama pia au lakini kwamba ambao ambayo ambapo ambalo
   ambaye hata bado tu sana si hakuna kuna yeye mimi wewe sisi ninyi hao hapo hapa pale
   kwenye kutoka hadi mpaka baada kabla zaidi moja kila wote yote zote kwani ili basi nini
   kisha je`.split(/\s+/),
);

const csvCell = (value: string | number) => {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** UTF-8 BOM so Excel opens Cyrillic and ʻ correctly. */
export const toCsv = (header: string[], rows: (string | number)[][]) =>
  '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
