import type { ExerciseSet } from '@/shared/api';
import {
  emptyAnswers,
  gradeExerciseSet,
  isGapCorrect,
  normalizeAnswer,
  shuffledDefinitions,
} from './grading';

const set: ExerciseSet = {
  id: 'ex1',
  level: 'A2',
  createdAt: '2026-01-01T00:00:00.000Z',
  multipleChoice: [{ id: 'mc1', question: 'Q?', options: ['a', 'b', 'c', 'd'], answerIndex: 2 }],
  gapFill: [
    {
      id: 'g1',
      before: 'Kids play ',
      after: ' on sand.',
      answer: 'beach soccer',
      alternatives: [],
    },
  ],
  matching: [
    { id: 'm1', term: 'parkour', definition: 'running and jumping over obstacles' },
    { id: 'm2', term: 'padel', definition: 'a racket sport' },
  ],
  openQuestions: [{ id: 'o1', question: 'Why?', sampleAnswer: 'Because.' }],
};

describe('exercise grading', () => {
  it('ignores case, spacing, quotes and punctuation in gap answers', () => {
    expect(normalizeAnswer('  Beach   Soccer. ')).toBe('beach soccer');
    expect(normalizeAnswer('don’t')).toBe("don't");
    expect(isGapCorrect(set.gapFill[0]!, 'BEACH soccer!')).toBe(true);
    expect(isGapCorrect(set.gapFill[0]!, 'soccer')).toBe(false);
    expect(isGapCorrect({ ...set.gapFill[0]!, alternatives: ['sand soccer'] }, 'sand soccer')).toBe(
      true,
    );
  });

  it('scores auto-checkable tasks only', () => {
    const answers = emptyAnswers();
    answers.choice.mc1 = 2;
    answers.gap.g1 = 'beach soccer';
    answers.match = { m1: 'm1', m2: 'm1' };
    answers.open.o1 = 'anything';
    const result = gradeExerciseSet(set, answers);
    expect(result).toEqual({
      results: { mc1: true, g1: true, m1: true, m2: false },
      correct: 3,
      total: 4,
    });
  });

  it('orders definitions deterministically', () => {
    expect(shuffledDefinitions(set.matching).map((t) => t.id)).toEqual(
      shuffledDefinitions([...set.matching].reverse()).map((t) => t.id),
    );
  });
});
