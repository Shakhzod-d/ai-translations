import type { CefrLevel } from '@/shared/config';
import type { LocalizedText, PhrasalVerb, WordSense } from '../contracts';

interface DictionaryEntry {
  level: CefrLevel;
  partOfSpeech: string;
  phonetic?: string;
  translation: LocalizedText;
  definition: string;
  synonyms: WordSense[];
  antonyms: WordSense[];
  examples: string[];
  /** Simpler replacement used by the simplification heuristic. */
  simple?: string;
  forms?: string[];
}

/** Small development dictionary. A real backend would call an LLM / lexical database. */
export const DICTIONARY: Record<string, DictionaryEntry> = {
  unprecedented: {
    level: 'C1',
    partOfSpeech: 'adjective',
    phonetic: '/ʌnˈpresɪdentɪd/',
    translation: { en: 'unprecedented', ru: 'беспрецедентный', uz: 'misli koʻrilmagan' },
    definition: 'Never done or known before.',
    synonyms: [
      { word: 'exceptional', explanation: 'Unusually great or rare', level: 'B2' },
      { word: 'remarkable', explanation: 'Worth noticing; unusual', level: 'B1' },
      { word: 'new', explanation: 'Not existing before', level: 'A1' },
    ],
    antonyms: [{ word: 'ordinary', explanation: 'Normal, not special', level: 'A2' }],
    examples: ['The city saw an unprecedented rise in prices.'],
    simple: 'very unusual',
  },
  significant: {
    level: 'B2',
    partOfSpeech: 'adjective',
    phonetic: '/sɪɡˈnɪfɪkənt/',
    translation: { en: 'significant', ru: 'важный, значительный', uz: 'muhim' },
    definition: 'Important or large enough to have an effect.',
    synonyms: [
      { word: 'important', explanation: 'Having great value or effect', level: 'A2' },
      { word: 'considerable', explanation: 'Fairly large in amount', level: 'B2' },
      { word: 'substantial', explanation: 'Large in size or value', level: 'C1' },
      { word: 'meaningful', explanation: 'Having a serious purpose', level: 'B2' },
    ],
    antonyms: [
      { word: 'minor', explanation: 'Small, not important', level: 'B1' },
      { word: 'trivial', explanation: 'Of little value', level: 'C1' },
    ],
    examples: ['This is a significant change.'],
    simple: 'important',
  },
  expand: {
    level: 'B1',
    partOfSpeech: 'verb',
    translation: { en: 'expand', ru: 'расширять', uz: 'kengaytirmoq' },
    definition: 'To become or make something larger.',
    synonyms: [
      { word: 'grow', explanation: 'Become bigger', level: 'A2' },
      { word: 'extend', explanation: 'Make longer or larger', level: 'B1' },
    ],
    antonyms: [
      { word: 'contract', explanation: 'Become smaller', level: 'B2' },
      { word: 'reduce', explanation: 'Make less', level: 'B1' },
      { word: 'shrink', explanation: 'Become smaller in size', level: 'B1' },
    ],
    examples: ['The company plans to expand into Asia.'],
    simple: 'grow',
    forms: ['expands', 'expanded', 'expanding'],
  },
  despite: {
    level: 'B1',
    partOfSpeech: 'preposition',
    translation: { en: 'despite', ru: 'несмотря на', uz: '…ga qaramay' },
    definition: 'Without being affected by something.',
    synonyms: [{ word: 'in spite of', explanation: 'Even though something happened', level: 'B1' }],
    antonyms: [],
    examples: ['Despite the rain, we went out.'],
    simple: 'even with',
  },
  challenges: {
    level: 'B1',
    partOfSpeech: 'noun',
    translation: { en: 'challenges', ru: 'трудности, вызовы', uz: 'qiyinchiliklar' },
    definition: 'Difficult tasks or problems.',
    synonyms: [
      { word: 'difficulties', explanation: 'Problems that are hard to deal with', level: 'B1' },
      { word: 'problems', explanation: 'Things that are hard to solve', level: 'A1' },
    ],
    antonyms: [],
    examples: ['We faced many challenges this year.'],
    simple: 'problems',
    forms: ['challenge'],
  },
  maintain: {
    level: 'B2',
    partOfSpeech: 'verb',
    translation: { en: 'maintain', ru: 'сохранять, поддерживать', uz: 'saqlab qolmoq' },
    definition: 'To keep something at the same level.',
    synonyms: [
      { word: 'keep', explanation: 'Continue to have', level: 'A1' },
      { word: 'preserve', explanation: 'Keep safe from change', level: 'B2' },
    ],
    antonyms: [{ word: 'lose', explanation: 'Stop having something', level: 'A2' }],
    examples: ['It is hard to maintain high quality.'],
    simple: 'keep',
    forms: ['maintains', 'maintained', 'maintaining'],
  },
  profitability: {
    level: 'C1',
    partOfSpeech: 'noun',
    translation: { en: 'profitability', ru: 'прибыльность', uz: 'daromadlilik' },
    definition: 'The ability to make money.',
    synonyms: [{ word: 'profit', explanation: 'Money you earn after costs', level: 'B1' }],
    antonyms: [{ word: 'loss', explanation: 'Money you lose', level: 'A2' }],
    examples: ['Profitability improved last quarter.'],
    simple: 'profit',
  },
  economic: {
    level: 'B1',
    partOfSpeech: 'adjective',
    translation: { en: 'economic', ru: 'экономический', uz: 'iqtisodiy' },
    definition: 'Related to trade, industry and money.',
    synonyms: [{ word: 'financial', explanation: 'Related to money', level: 'B2' }],
    antonyms: [],
    examples: ['The economic situation is improving.'],
    simple: 'money',
  },
  approximately: {
    level: 'B1',
    partOfSpeech: 'adverb',
    translation: { en: 'approximately', ru: 'приблизительно', uz: 'taxminan' },
    definition: 'Close to an exact number, but not exactly.',
    synonyms: [{ word: 'about', explanation: 'Near a number', level: 'A1' }],
    antonyms: [{ word: 'exactly', explanation: 'Precisely', level: 'A2' }],
    examples: ['It takes approximately two hours.'],
    simple: 'about',
  },
  consequently: {
    level: 'B2',
    partOfSpeech: 'adverb',
    translation: { en: 'consequently', ru: 'следовательно', uz: 'natijada' },
    definition: 'As a result.',
    synonyms: [
      { word: 'therefore', explanation: 'For that reason', level: 'B2' },
      { word: 'so', explanation: 'As a result', level: 'A1' },
    ],
    antonyms: [],
    examples: ['He missed the bus and consequently was late.'],
    simple: 'so',
  },
  demonstrate: {
    level: 'B2',
    partOfSpeech: 'verb',
    translation: { en: 'demonstrate', ru: 'демонстрировать', uz: 'namoyish etmoq' },
    definition: 'To show clearly that something is true.',
    synonyms: [
      { word: 'show', explanation: 'Let someone see', level: 'A1' },
      { word: 'prove', explanation: 'Show that something is true', level: 'B1' },
    ],
    antonyms: [{ word: 'hide', explanation: 'Keep out of sight', level: 'A2' }],
    examples: ['The study demonstrates a clear link.'],
    simple: 'show',
    forms: ['demonstrates', 'demonstrated', 'demonstrating'],
  },
  sustainable: {
    level: 'B2',
    partOfSpeech: 'adjective',
    translation: { en: 'sustainable', ru: 'устойчивый', uz: 'barqaror' },
    definition: 'Able to continue for a long time without causing damage.',
    synonyms: [{ word: 'lasting', explanation: 'Continuing for a long time', level: 'B2' }],
    antonyms: [{ word: 'unsustainable', explanation: 'Cannot continue for long', level: 'C1' }],
    examples: ['We need sustainable energy sources.'],
    simple: 'long-lasting',
  },
};

const FORM_INDEX = new Map<string, string>(
  Object.entries(DICTIONARY).flatMap(([lemma, entry]) => [
    [lemma, lemma],
    ...(entry.forms ?? []).map((form): [string, string] => [form, lemma]),
  ]),
);

export const lookup = (word: string) => {
  const lemma = FORM_INDEX.get(word.toLowerCase());
  return lemma ? { lemma, entry: DICTIONARY[lemma]! } : null;
};

export const PHRASAL_VERBS: PhrasalVerb[] = [
  {
    phrase: 'figure out',
    meaning: 'to understand or solve something',
    example: 'I finally figured out how the system works.',
    translation: { ru: 'разобраться', uz: 'tushunib olmoq' },
  },
  {
    phrase: 'carry out',
    meaning: 'to do or complete a task',
    example: 'The team carried out the research.',
    translation: { ru: 'выполнять', uz: 'amalga oshirmoq' },
  },
  {
    phrase: 'set up',
    meaning: 'to create or start something',
    example: 'They set up a new company.',
    translation: { ru: 'основать, настроить', uz: 'tashkil qilmoq' },
  },
  {
    phrase: 'look into',
    meaning: 'to investigate or examine',
    example: 'We will look into the problem.',
    translation: { ru: 'изучить, разобраться', uz: 'oʻrganib chiqmoq' },
  },
  {
    phrase: 'point out',
    meaning: 'to tell someone about a fact',
    example: 'She pointed out a mistake.',
    translation: { ru: 'указать', uz: 'koʻrsatib oʻtmoq' },
  },
  {
    phrase: 'come up with',
    meaning: 'to think of an idea or plan',
    example: 'He came up with a great solution.',
    translation: { ru: 'придумать', uz: 'oʻylab topmoq' },
  },
  {
    phrase: 'cut down',
    meaning: 'to reduce the amount of something',
    example: 'You should cut down on sugar.',
    translation: { ru: 'сократить', uz: 'kamaytirmoq' },
  },
  {
    phrase: 'give up',
    meaning: 'to stop trying',
    example: 'Never give up on your goals.',
    translation: { ru: 'сдаться', uz: 'taslim boʻlmoq' },
  },
  {
    phrase: 'turn out',
    meaning: 'to happen in a particular way',
    example: 'It turned out to be true.',
    translation: { ru: 'оказаться', uz: 'maʼlum boʻlmoq' },
  },
  {
    phrase: 'deal with',
    meaning: 'to handle a problem or situation',
    example: 'We must deal with this quickly.',
    translation: { ru: 'справляться', uz: 'hal qilmoq' },
  },
];

const inflect = (verb: string) => {
  const irregular: Record<string, string[]> = {
    set: ['set', 'sets', 'setting'],
    cut: ['cut', 'cuts', 'cutting'],
    come: ['come', 'comes', 'came', 'coming'],
    give: ['give', 'gives', 'gave', 'given', 'giving'],
    deal: ['deal', 'deals', 'dealt', 'dealing'],
  };
  if (irregular[verb]) return irregular[verb];
  const base = verb.endsWith('e') ? verb.slice(0, -1) : verb;
  return [verb, `${verb}s`, `${base}ed`, `${base}ing`];
};

export const detectPhrasalVerbs = (text: string): PhrasalVerb[] =>
  PHRASAL_VERBS.filter(({ phrase }) => {
    const [verb = '', ...rest] = phrase.split(' ');
    const pattern = new RegExp(`\\b(${inflect(verb).join('|')})\\s+${rest.join('\\s+')}\\b`, 'i');
    return pattern.test(text);
  });
