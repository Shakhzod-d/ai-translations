import type { VocabularyItem } from '@/shared/api';
import { DEFAULT_VOCABULARY_FILTERS, filterVocabulary } from './filter';

const item = (
  word: string,
  createdAt: string,
  extra: Partial<VocabularyItem> = {},
): VocabularyItem => ({ id: word, word, translation: {}, createdAt, ...extra });

const items = [
  item('significant', '2026-01-02', { level: 'B2', translation: { ru: 'важный' } }),
  item('expand', '2026-01-03', { level: 'B1', translation: { uz: 'kengaytirmoq' } }),
  item('apple', '2026-01-01', { level: 'A1' }),
];

describe('filterVocabulary', () => {
  it('sorts by most recent by default', () => {
    expect(filterVocabulary(items, DEFAULT_VOCABULARY_FILTERS).map((i) => i.word)).toEqual([
      'expand',
      'significant',
      'apple',
    ]);
  });
  it('sorts alphabetically', () => {
    expect(
      filterVocabulary(items, { ...DEFAULT_VOCABULARY_FILTERS, sort: 'alpha' }).map((i) => i.word),
    ).toEqual(['apple', 'expand', 'significant']);
  });
  it('searches translations too', () => {
    expect(
      filterVocabulary(items, { ...DEFAULT_VOCABULARY_FILTERS, search: 'важ' }).map((i) => i.word),
    ).toEqual(['significant']);
  });
  it('filters by level and translation language', () => {
    expect(
      filterVocabulary(items, { ...DEFAULT_VOCABULARY_FILTERS, level: 'B1' }).map((i) => i.word),
    ).toEqual(['expand']);
    expect(
      filterVocabulary(items, { ...DEFAULT_VOCABULARY_FILTERS, language: 'ru' }).map((i) => i.word),
    ).toEqual(['significant']);
  });
});
