import { RotateCcw, Trophy } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { shuffledDefinitions, type ExerciseSet } from '@/entities/exercise';
import { Button } from '@/shared/ui';
import { useExerciseAttempt } from '../model/use-exercise-attempt';
import { TaskSection } from './task-section';
import { GapFillItem, MatchingItem, MultipleChoiceItem, OpenQuestionItem } from './tasks';

const ScoreSummary = ({ correct, total }: { correct: number; total: number }) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  // Move focus to the result so keyboard and screen-reader users hear the score.
  useEffect(() => ref.current?.focus(), []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      className="bg-primary/5 border-primary/20 flex items-center gap-3 rounded-xl border p-4 focus-visible:outline-none"
    >
      <Trophy className="text-primary size-6 shrink-0" aria-hidden />
      <div>
        <p className="font-semibold">{t('exercises.score', { correct, total })}</p>
        <p className="text-muted-foreground text-sm">{t('exercises.scoreHint')}</p>
      </div>
    </div>
  );
};

/** Interactive practice for one exercise set: answer, check, see results, try again. */
export const ExercisePractice = ({ set }: { set: ExerciseSet }) => {
  const { t } = useTranslation();
  const attempt = useExerciseAttempt(set);
  const { answers, checked, grade } = attempt;
  const definitions = useMemo(() => shuffledDefinitions(set.matching), [set.matching]);
  const result = (id: string) => grade?.results[id];

  const sections = [
    set.multipleChoice.length > 0 && {
      key: 'mc',
      title: t('exercises.multipleChoice'),
      hint: t('exercises.multipleChoiceHint'),
      items: set.multipleChoice.map((task, i) => (
        <MultipleChoiceItem
          key={task.id}
          task={task}
          number={i + 1}
          value={answers.choice[task.id]}
          checked={checked}
          correct={result(task.id)}
          onChange={(v) => attempt.setChoice(task.id, v)}
        />
      )),
    },
    set.gapFill.length > 0 && {
      key: 'gap',
      title: t('exercises.gapFill'),
      hint: t('exercises.gapFillHint'),
      items: set.gapFill.map((task, i) => (
        <GapFillItem
          key={task.id}
          task={task}
          number={i + 1}
          value={answers.gap[task.id] ?? ''}
          checked={checked}
          correct={result(task.id)}
          onChange={(v) => attempt.setText('gap', task.id, v)}
        />
      )),
    },
    set.matching.length > 0 && {
      key: 'match',
      title: t('exercises.matching'),
      hint: t('exercises.matchingHint'),
      items: set.matching.map((task) => (
        <MatchingItem
          key={task.id}
          task={task}
          definitions={definitions}
          value={answers.match[task.id] ?? ''}
          checked={checked}
          correct={result(task.id)}
          onChange={(v) => attempt.setText('match', task.id, v)}
        />
      )),
    },
    set.openQuestions.length > 0 && {
      key: 'open',
      title: t('exercises.openQuestions'),
      hint: t('exercises.openQuestionsHint'),
      items: set.openQuestions.map((task, i) => (
        <OpenQuestionItem
          key={task.id}
          task={task}
          number={i + 1}
          value={answers.open[task.id] ?? ''}
          checked={checked}
          onChange={(v) => attempt.setText('open', task.id, v)}
        />
      )),
    },
  ].filter((s) => !!s);

  return (
    <div className="flex flex-col gap-10">
      {sections.map((section, i) => (
        <TaskSection key={section.key} index={i + 1} title={section.title} hint={section.hint}>
          {section.items}
        </TaskSection>
      ))}
      <div className="flex flex-col gap-4">
        {grade && <ScoreSummary correct={grade.correct} total={grade.total} />}
        <div className="flex flex-wrap gap-2">
          {checked ? (
            <Button onClick={attempt.reset} className="w-full sm:w-auto">
              <RotateCcw aria-hidden /> {t('exercises.retry')}
            </Button>
          ) : (
            <Button onClick={attempt.check} className="w-full sm:w-auto">
              {t('exercises.check')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
