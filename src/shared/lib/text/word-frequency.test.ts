import { computeWordFrequency, SWAHILI_STOPWORDS, toCsv } from './word-frequency';

describe('computeWordFrequency', () => {
  it('counts case-insensitively, sorts by count then alphabetically, and shares tied ranks', () => {
    const { rows, totalTokens, uniqueWords } = computeWordFrequency(
      'Habari, habari! Mama na Baba. na mama, shule.',
    );
    expect(totalTokens).toBe(8);
    expect(uniqueWords).toBe(5);
    expect(rows.map((r) => [r.rank, r.word, r.count])).toEqual([
      [1, 'habari', 2],
      [1, 'mama', 2],
      [1, 'na', 2],
      [4, 'baba', 1],
      [4, 'shule', 1],
    ]);
    expect(rows[0]!.percent).toBeCloseTo(25);
  });

  it('applies minimum length and stopword filters without changing the token total', () => {
    const result = computeWordFrequency('na ya watoto wa shule na walimu', {
      minLength: 3,
      exclude: SWAHILI_STOPWORDS,
    });
    expect(result.totalTokens).toBe(7);
    expect(result.rows.map((r) => r.word)).toEqual(['shule', 'walimu', 'watoto']);
  });

  it('handles empty text', () => {
    expect(computeWordFrequency('  ')).toEqual({ totalTokens: 0, uniqueWords: 0, rows: [] });
  });
});

describe('toCsv', () => {
  it('quotes cells that need it and prefixes a BOM', () => {
    expect(toCsv(['a', 'b'], [['x,y', 'say "hi"']])).toBe('﻿a,b\r\n"x,y","say ""hi"""');
  });
});
