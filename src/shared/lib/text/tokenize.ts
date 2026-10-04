export type TextToken =
  | { kind: 'word'; value: string; index: number }
  | { kind: 'space'; value: string; index: number }
  | { kind: 'punct'; value: string; index: number };

const TOKEN_RE = /(\p{L}+(?:[''’-]\p{L}+)*)|(\s+)|([^\p{L}\s]+)/gu;

/** Splits text into word / whitespace / punctuation tokens, preserving the original text exactly. */
export const tokenize = (text: string): TextToken[] => {
  const tokens: TextToken[] = [];
  let index = 0;
  for (const match of text.matchAll(TOKEN_RE)) {
    const [value, word, space] = match;
    const kind = word ? 'word' : space ? 'space' : 'punct';
    tokens.push({ kind, value, index: index++ });
  }
  return tokens;
};

export const normalizeWord = (word: string) => word.toLocaleLowerCase().replace(/[’]/g, "'").trim();

export const countWords = (text: string) => (text.match(/\p{L}+/gu) ?? []).length;

const WORDS_PER_MINUTE = 200;
export const estimateReadingMinutes = (wordCount: number) =>
  Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

export const splitParagraphs = (text: string): string[] =>
  text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean);

export const splitSentences = (paragraph: string): string[] =>
  paragraph.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((s) => s.trim()) ?? [paragraph];
