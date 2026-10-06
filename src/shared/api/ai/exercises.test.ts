import { normalizeExercises, type GeneratedExercises } from './exercises';

const raw: GeneratedExercises = {
  multipleChoice: [
    {
      question: 'Which is new?',
      options: ['Padel', 'Chess', 'Tennis', 'Golf'],
      answerIndex: 0,
      explanation: '',
    },
    { question: 'Broken', options: ['a', 'b'], answerIndex: 5, explanation: '' },
    { question: 'Dupes', options: ['a', 'a', 'b'], answerIndex: 0, explanation: '' },
  ],
  gapFill: [
    {
      sentence: 'Parkour is about ____ obstacles.',
      answer: 'overcoming',
      alternatives: ['overcoming', 'passing'],
    },
    { sentence: 'No gap here.', answer: 'x', alternatives: [] },
    { sentence: 'Two ____ gaps ____.', answer: 'x', alternatives: [] },
  ],
  matching: [
    { term: 'Padel', definition: 'A racket sport.' },
    { term: 'padel', definition: 'Duplicate.' },
  ],
  openQuestions: [{ question: ' Define parkour. ', sampleAnswer: 'Running and jumping.' }],
};

describe('normalizeExercises', () => {
  const set = normalizeExercises(raw, 'A2', () => 0);

  it('keeps the correct answer when shuffling options', () => {
    expect(set.multipleChoice).toHaveLength(1);
    const [task] = set.multipleChoice;
    expect(task!.options[task!.answerIndex]).toBe('Padel');
    expect(task!.explanation).toBeUndefined();
  });

  it('splits gap sentences and drops malformed ones', () => {
    expect(set.gapFill).toEqual([
      expect.objectContaining({
        before: 'Parkour is about ',
        after: ' obstacles.',
        answer: 'overcoming',
        alternatives: ['passing'],
      }),
    ]);
  });

  it('drops duplicate matching terms and trims questions', () => {
    expect(set.matching.map((m) => m.term)).toEqual(['Padel']);
    expect(set.openQuestions[0]!.question).toBe('Define parkour.');
    expect(set.level).toBe('A2');
  });
});
