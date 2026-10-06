import { z } from 'zod';
import type { CefrLevel } from '@/shared/config';
import { createId } from '@/shared/lib';
import type { ExerciseSet } from '../contracts';
import { runStructured } from './run-structured';

/** Long texts are trimmed: five questions per task type never need more than this. */
const MAX_TEXT_CHARS = 14_000;
const TASKS_PER_TYPE = 5;
const GAP = /_{2,}/;

const QUESTION_GUIDE: Record<CefrLevel, string> = {
  A1: 'very short questions with the most common words; answers are stated word-for-word in the text',
  A2: 'short, simple questions about clearly stated facts and the main idea; everyday vocabulary',
  B1: 'questions about facts, main ideas and simple inferences; common vocabulary',
  B2: 'questions about details, inferences and the writer’s purpose',
  C1: 'questions about implied meaning, attitude and nuance',
};

const generatedSchema = z.object({
  multipleChoice: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      answerIndex: z.number().int(),
      explanation: z.string(),
    }),
  ),
  gapFill: z.array(
    z.object({ sentence: z.string(), answer: z.string(), alternatives: z.array(z.string()) }),
  ),
  matching: z.array(z.object({ term: z.string(), definition: z.string() })),
  openQuestions: z.array(z.object({ question: z.string(), sampleAnswer: z.string() })),
});
export type GeneratedExercises = z.infer<typeof generatedSchema>;

const shuffle = <T>(items: T[], random: () => number) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
};

const clean = (s: string) => s.trim().replace(/\s+/g, ' ');

/**
 * Models produce slightly malformed items now and then (answer index out of range, gap
 * missing or repeated, duplicate terms). Those are dropped rather than shown broken.
 * Options are shuffled because models put the right answer first far too often.
 */
export const normalizeExercises = (
  raw: GeneratedExercises,
  level: CefrLevel,
  random: () => number = Math.random,
): ExerciseSet => {
  const seenTerms = new Set<string>();
  return {
    id: createId('ex'),
    level,
    createdAt: new Date().toISOString(),
    multipleChoice: raw.multipleChoice.flatMap((task) => {
      const options = task.options.map(clean).filter(Boolean);
      const correct = options[task.answerIndex];
      if (!task.question.trim() || options.length < 2 || correct === undefined) return [];
      if (new Set(options).size !== options.length) return [];
      const shuffled = shuffle(options, random);
      return [
        {
          id: createId('mc'),
          question: clean(task.question),
          options: shuffled,
          answerIndex: shuffled.indexOf(correct),
          explanation: clean(task.explanation) || undefined,
        },
      ];
    }),
    gapFill: raw.gapFill.flatMap((task) => {
      const parts = task.sentence.split(GAP);
      const answer = clean(task.answer);
      if (parts.length !== 2 || !answer) return [];
      return [
        {
          id: createId('gap'),
          before: parts[0]!.trimStart(),
          after: parts[1]!.trimEnd(),
          answer,
          alternatives: task.alternatives.map(clean).filter((a) => a && a !== answer),
        },
      ];
    }),
    matching: raw.matching.flatMap((task) => {
      const term = clean(task.term);
      const key = term.toLowerCase();
      if (!term || !task.definition.trim() || seenTerms.has(key)) return [];
      seenTerms.add(key);
      return [{ id: createId('match'), term, definition: clean(task.definition) }];
    }),
    openQuestions: raw.openQuestions.flatMap((task) =>
      task.question.trim()
        ? [
            {
              id: createId('open'),
              question: clean(task.question),
              sampleAnswer: clean(task.sampleAnswer),
            },
          ]
        : [],
    ),
  };
};

export const generateExercisesWithAi = async (
  text: string,
  level: CefrLevel,
  signal?: AbortSignal,
): Promise<ExerciseSet> => {
  const raw = await runStructured({
    system:
      'You are an experienced EFL teacher who writes reading-comprehension tasks for school students, ' +
      'in the style of corpus-based coursebooks. Every task must be answerable from the text alone.',
    effort: 'medium',
    signal,
    schema: generatedSchema,
    prompt: `Write reading tasks for this text, for learners at CEFR ${level}: ${QUESTION_GUIDE[level]}.
Use only language a ${level} learner can understand, in the questions and in the options.

- multipleChoice: ${TASKS_PER_TYPE} questions, each with exactly 4 options. Only one option is correct according to the text; the others are plausible but clearly wrong. answerIndex is the 0-based index of the correct option. explanation: one short sentence saying where the text shows the answer.
- gapFill: ${TASKS_PER_TYPE} sentences taken or closely adapted from the text, each with exactly one gap written as "____" replacing one important word or short phrase (1–3 words). answer is the missing text exactly as it fits the sentence. alternatives: other answers that are equally correct, usually an empty list.
- matching: ${TASKS_PER_TYPE} key words or phrases from the text (term, as used in the text) with a short, simple definition each. Terms must all be different.
- openQuestions: ${TASKS_PER_TYPE - 2} questions that need a short answer in the learner's own words (e.g. "Why…?", "What is the difference between…?", "Describe…"). sampleAnswer: a model answer of 1–2 sentences at ${level}.

Spread the tasks over the whole text, keep them in text order, and do not repeat the same fact across task types.

<text>
${text.slice(0, MAX_TEXT_CHARS)}
</text>`,
  });
  return normalizeExercises(raw, level);
};
