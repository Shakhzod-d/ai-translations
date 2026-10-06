import type { ExerciseSet, GapFillTask, MatchingTask } from '@/shared/api';
import type { CefrLevel } from '@/shared/config';

/** A learner's answers to one exercise set, keyed by task id. */
export interface ExerciseAnswers {
  choice: Record<string, number>;
  gap: Record<string, string>;
  /** Matching task id → id of the matching task whose definition was picked. */
  match: Record<string, string>;
  open: Record<string, string>;
}

export const emptyAnswers = (): ExerciseAnswers => ({ choice: {}, gap: {}, match: {}, open: {} });

/** Case, spacing, curly quotes and surrounding punctuation never make an answer wrong. */
export const normalizeAnswer = (value: string) =>
  value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/^[\s\p{P}]+|[\s\p{P}]+$/gu, '')
    .replace(/\s+/g, ' ');

export const isGapCorrect = (task: GapFillTask, input: string | undefined) => {
  if (!input) return false;
  const given = normalizeAnswer(input);
  return [task.answer, ...task.alternatives].some((a) => normalizeAnswer(a) === given);
};

export interface ExerciseResult {
  /** Task id → correct? Only auto-graded tasks are present. */
  results: Record<string, boolean>;
  correct: number;
  total: number;
}

/** Grades the auto-checkable tasks. Open questions are self-assessed and not scored. */
export const gradeExerciseSet = (set: ExerciseSet, answers: ExerciseAnswers): ExerciseResult => {
  const results: Record<string, boolean> = {};
  for (const t of set.multipleChoice) results[t.id] = answers.choice[t.id] === t.answerIndex;
  for (const t of set.gapFill) results[t.id] = isGapCorrect(t, answers.gap[t.id]);
  for (const t of set.matching) results[t.id] = answers.match[t.id] === t.id;
  const values = Object.values(results);
  return { results, correct: values.filter(Boolean).length, total: values.length };
};

const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/**
 * Definitions in a stable order that differs from the term order, so the answer isn't
 * simply "same row". Stable across renders and reloads (derived from ids, not random).
 */
export const shuffledDefinitions = (tasks: MatchingTask[]) =>
  [...tasks].sort((a, b) => hash(a.id) - hash(b.id));

/** School learners reading authentic texts are the main audience. */
export const DEFAULT_EXERCISE_LEVEL: CefrLevel = 'A2';

export const findExerciseSet = (sets: ExerciseSet[], level: CefrLevel) =>
  sets.find((s) => s.level === level);

export const countTasks = (set: ExerciseSet) =>
  set.multipleChoice.length + set.gapFill.length + set.matching.length + set.openQuestions.length;
