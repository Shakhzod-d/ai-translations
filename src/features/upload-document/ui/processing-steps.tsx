import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PROCESSING_STAGES, type ProcessingStage } from '@/shared/api';
import { cn } from '@/shared/lib';
import { Progress, Spinner } from '@/shared/ui';

/** Reusable processing-state indicator: overall progress + stage checklist. */
export const ProcessingSteps = ({
  stage,
  uploadProgress,
}: {
  stage: ProcessingStage;
  uploadProgress?: number;
}) => {
  const { t } = useTranslation();
  const current = PROCESSING_STAGES.indexOf(stage);
  const overall =
    stage === 'uploading' && uploadProgress !== undefined
      ? uploadProgress / PROCESSING_STAGES.length
      : (current + 0.5) / PROCESSING_STAGES.length;

  return (
    <div className="flex w-full flex-col gap-4">
      <Progress value={overall} label={t('processing.title')} />
      <p className="sr-only" aria-live="polite">
        {t(`processing.stages.${stage}`)}
      </p>
      <ol className="flex flex-col gap-2">
        {PROCESSING_STAGES.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={s}
              className={cn(
                'flex items-center gap-2.5 text-sm',
                done || active ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full border',
                  done && 'border-success bg-success text-success-foreground',
                  active && 'border-primary',
                )}
              >
                {done ? (
                  <Check className="size-3" aria-hidden />
                ) : active ? (
                  <Spinner className="text-primary size-3" />
                ) : null}
              </span>
              <span className={cn(active && 'font-medium')}>{t(`processing.stages.${s}`)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
