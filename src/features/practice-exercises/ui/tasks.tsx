import { useTranslation } from 'react-i18next';
import type {
  GapFillTask,
  MatchingTask,
  MultipleChoiceTask,
  OpenQuestionTask,
} from '@/entities/exercise';
import { cn } from '@/shared/lib';
import { Input, Select, Textarea } from '@/shared/ui';
import { ResultMark } from './result-mark';

const itemClass = 'border-border bg-card rounded-xl border p-4';
const LETTERS = 'ABCDEFGH';

export const MultipleChoiceItem = ({
  task,
  number,
  value,
  checked,
  correct,
  onChange,
}: {
  task: MultipleChoiceTask;
  number: number;
  value: number | undefined;
  checked: boolean;
  correct: boolean | undefined;
  onChange: (value: number) => void;
}) => (
  <li className={itemClass}>
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 flex w-full items-start gap-2 font-medium">
        <span className="text-muted-foreground tabular-nums">{number}.</span>
        <span className="flex-1">{task.question}</span>
        {checked && <ResultMark correct={!!correct} />}
      </legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {task.options.map((option, i) => {
          const selected = value === i;
          const isAnswer = i === task.answerIndex;
          return (
            <label
              key={i}
              className={cn(
                'border-border has-focus-visible:ring-ring flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors has-focus-visible:ring-2',
                !checked && 'hover:bg-muted',
                !checked && selected && 'border-primary bg-primary/5',
                checked && 'cursor-default',
                checked && isAnswer && 'border-success bg-success/10',
                checked && selected && !isAnswer && 'border-error bg-error/10',
              )}
            >
              <input
                type="radio"
                name={task.id}
                className="sr-only"
                checked={selected}
                disabled={checked}
                onChange={() => onChange(i)}
              />
              <span
                className={cn(
                  'border-border flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  selected && 'border-primary bg-primary text-primary-foreground',
                )}
                aria-hidden
              >
                {LETTERS[i]}
              </span>
              <span className="min-w-0 flex-1">{option}</span>
            </label>
          );
        })}
      </div>
      {checked && task.explanation && (
        <p className="text-muted-foreground text-sm">{task.explanation}</p>
      )}
    </fieldset>
  </li>
);

export const GapFillItem = ({
  task,
  number,
  value,
  checked,
  correct,
  onChange,
}: {
  task: GapFillTask;
  number: number;
  value: string;
  checked: boolean;
  correct: boolean | undefined;
  onChange: (value: string) => void;
}) => {
  const { t } = useTranslation();
  // Wide enough for the expected answer, without giving away its exact length.
  const width = `${Math.max(8, Math.ceil(task.answer.length / 4) * 4 + 2)}ch`;
  return (
    <li className={cn(itemClass, 'flex items-start gap-2')}>
      <span className="text-muted-foreground leading-9 tabular-nums">{number}.</span>
      <p className="min-w-0 flex-1 leading-9">
        {task.before}
        <Input
          aria-label={t('exercises.gap', { n: number })}
          value={value}
          readOnly={checked}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{ width }}
          className={cn(
            'mx-1 inline-block h-8 max-w-full align-baseline',
            checked && (correct ? 'border-success' : 'border-error'),
          )}
        />
        {task.after}
        {checked && !correct && (
          <span className="text-success ml-2 text-sm font-medium">
            {t('exercises.answer', { answer: task.answer })}
          </span>
        )}
      </p>
      {checked && <ResultMark correct={!!correct} className="mt-2" />}
    </li>
  );
};

export const MatchingItem = ({
  task,
  definitions,
  value,
  checked,
  correct,
  onChange,
}: {
  task: MatchingTask;
  definitions: MatchingTask[];
  value: string;
  checked: boolean;
  correct: boolean | undefined;
  onChange: (value: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <li className={cn(itemClass, 'flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4')}>
      <span className="font-semibold sm:w-40 sm:shrink-0">{task.term}</span>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Select
          aria-label={task.term}
          value={value}
          disabled={checked}
          onValueChange={onChange}
          options={[
            { value: '', label: t('exercises.chooseDefinition') },
            ...definitions.map((d) => ({ value: d.id, label: d.definition })),
          ]}
          className={cn(
            'min-w-0 flex-1 truncate',
            checked && (correct ? 'border-success' : 'border-error'),
          )}
        />
        {checked && <ResultMark correct={!!correct} />}
      </div>
      {checked && !correct && (
        <p className="text-success text-sm font-medium sm:basis-full">
          {t('exercises.answer', { answer: task.definition })}
        </p>
      )}
    </li>
  );
};

export const OpenQuestionItem = ({
  task,
  number,
  value,
  checked,
  onChange,
}: {
  task: OpenQuestionTask;
  number: number;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
}) => {
  const { t } = useTranslation();
  return (
    <li className={cn(itemClass, 'flex flex-col gap-3')}>
      <label htmlFor={task.id} className="flex gap-2 font-medium">
        <span className="text-muted-foreground tabular-nums">{number}.</span>
        {task.question}
      </label>
      <Textarea
        id={task.id}
        rows={3}
        placeholder={t('exercises.yourAnswer')}
        value={value}
        readOnly={checked}
        onChange={(e) => onChange(e.target.value)}
      />
      {/* Re-keyed so it opens by itself once answers are checked. */}
      <details key={String(checked)} open={checked} className="group text-sm">
        <summary className="text-primary w-fit cursor-pointer font-medium">
          {t('exercises.showSample')}
        </summary>
        <p className="bg-muted mt-2 rounded-lg px-3 py-2">
          <span className="sr-only">{t('exercises.sampleAnswer')}: </span>
          {task.sampleAnswer}
        </p>
      </details>
    </li>
  );
};
