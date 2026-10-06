import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib';

/** Correct/incorrect indicator with a text label for screen readers. */
export const ResultMark = ({ correct, className }: { correct: boolean; className?: string }) => {
  const { t } = useTranslation();
  const Icon = correct ? CheckCircle2 : XCircle;
  return (
    <span
      className={cn('inline-flex shrink-0', correct ? 'text-success' : 'text-error', className)}
    >
      <Icon className="size-5" aria-hidden />
      <span className="sr-only">{correct ? t('exercises.correct') : t('exercises.incorrect')}</span>
    </span>
  );
};
