import { countWords, splitParagraphs, tokenize } from './tokenize';

describe('tokenize', () => {
  it('round-trips the original text exactly', () => {
    const text = "Despite the rain, it's “unprecedented” — really!";
    expect(
      tokenize(text)
        .map((t) => t.value)
        .join(''),
    ).toBe(text);
  });

  it('keeps contractions and hyphenated words as single words', () => {
    const words = tokenize("It's a well-known fact.")
      .filter((t) => t.kind === 'word')
      .map((t) => t.value);
    expect(words).toEqual(["It's", 'a', 'well-known', 'fact']);
  });

  it('handles Cyrillic and Uzbek letters', () => {
    expect(countWords('Загрузить статью oʻqish')).toBe(3);
  });
});

describe('splitParagraphs', () => {
  it('splits on blank lines and unwraps hard line breaks', () => {
    expect(splitParagraphs('one\ntwo\n\n\nthree\r\n')).toEqual(['one two', 'three']);
  });
});
