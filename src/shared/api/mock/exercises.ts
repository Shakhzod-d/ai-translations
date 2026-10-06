import type { CefrLevel } from '@/shared/config';
import type { ExerciseSet } from '../contracts';
import { normalizeExercises } from '../ai/exercises';

const sentencesOf = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length >= 5);

/** Longest word of a sentence: a cheap stand-in for "an important word". */
const keyWord = (sentence: string) =>
  [...sentence.matchAll(/\p{L}{4,}/gu)].map((m) => m[0]).sort((a, b) => b.length - a.length)[0];

/**
 * Deterministic exercises for tests and offline demos. Built from the text itself,
 * so answers are always correct for it. Goes through the same normalization as AI output.
 */
export const buildMockExercises = (text: string, level: CefrLevel): ExerciseSet => {
  const sentences = sentencesOf(text).slice(0, 5);
  const words = sentences.map(keyWord).filter((w): w is string => !!w);
  const distractors = ['holiday', 'weather', 'football', 'kitchen'];
  return normalizeExercises(
    {
      multipleChoice: sentences.slice(0, 3).map((sentence, i) => ({
        question: `Which word appears in sentence ${i + 1} of the text?`,
        options: [words[i] ?? 'text', ...distractors.slice(0, 3)],
        answerIndex: 0,
        explanation: sentence,
      })),
      gapFill: sentences.flatMap((sentence) => {
        const word = keyWord(sentence);
        return word
          ? [{ sentence: sentence.replace(word, '____'), answer: word, alternatives: [] }]
          : [];
      }),
      matching: words.slice(0, 3).map((term) => ({ term, definition: `Meaning of “${term}”.` })),
      openQuestions: [
        { question: 'What is the main idea of the text?', sampleAnswer: sentences[0] ?? '' },
      ],
    },
    level,
    () => 0.5,
  );
};
