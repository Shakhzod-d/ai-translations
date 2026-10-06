import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ProcessingStage } from '@/shared/api';
import { cn } from '@/shared/lib';
import { Progress, Spinner } from '@/shared/ui';
import { UPLOAD_STAGES } from '../model/processing';

/** Reusable processing-state indicator: overall progress + stage checklist. */
export const ProcessingSteps = ({
  stage,
  uploadProgress,
  stages = UPLOAD_STAGES,
}: {
  stage: ProcessingStage;
  uploadProgress?: number;
  /** The stages this job goes through, in order. */
  stages?: readonly ProcessingStage[];
}) => {
  const { t } = useTranslation();
  const current = stages.indexOf(stage);
  const overall =
    stage === 'uploading' && uploadProgress !== undefined
      ? uploadProgress / stages.length
      : (current + 0.5) / stages.length;

  return (
    <div className="flex w-full flex-col gap-4">
      <Progress value={overall} label={t('processing.title')} />
      <p className="sr-only" aria-live="polite">
        {t(`processing.stages.${stage}`)}
      </p>
      <ol className="flex flex-col gap-2">
        {stages.map((s, i) => {
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
