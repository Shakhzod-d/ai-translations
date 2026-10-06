import { ListChecks, RefreshCw, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CefrLevel } from '@/shared/config';
import { Button, QueryErrorState, TextSkeleton } from '@/shared/ui';
import { useGenerateExercises } from '../model/use-generate-exercises';

const Generating = ({ level }: { level: CefrLevel }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6" aria-busy aria-live="polite">
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <Sparkles
          className="text-primary size-4 animate-pulse motion-reduce:animate-none"
          aria-hidden
        />
        {t('exercises.generating', { level })}
      </p>
      <TextSkeleton lines={4} />
      <TextSkeleton lines={4} />
    </div>
  );
};

/** Shown in place of an exercise set that hasn't been created yet. */
export const GenerateExercisesPrompt = ({
  articleId,
  level,
}: {
  articleId: string;
  level: CefrLevel;
}) => {
  const { t } = useTranslation();
  const generate = useGenerateExercises(articleId);
  const isThisLevel = generate.variables === level;

  if (generate.isPending && isThisLevel) return <Generating level={level} />;
  if (generate.isError && isThisLevel) {
    return <QueryErrorState error={generate.error} onRetry={() => generate.mutate(level)} />;
  }
  return (
    <div className="border-border flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center">
      <ListChecks className="text-primary size-6" aria-hidden />
      <h2 className="font-semibold">{t('exercises.emptyTitle', { level })}</h2>
      <p className="text-muted-foreground max-w-sm text-sm text-pretty">
        {t('exercises.emptyBody')}
      </p>
      <Button className="mt-1" onClick={() => generate.mutate(level)}>
        <Sparkles aria-hidden /> {t('exercises.generate', { level })}
      </Button>
    </div>
  );
};

/** Replaces the current set with freshly written tasks. */
export const RegenerateExercisesButton = ({
  articleId,
  level,
}: {
  articleId: string;
  level: CefrLevel;
}) => {
  const { t } = useTranslation();
  const generate = useGenerateExercises(articleId);
  return (
    <Button
      variant="outline"
      size="sm"
      loading={generate.isPending}
      onClick={() => generate.mutate(level)}
    >
      <RefreshCw aria-hidden /> {t('exercises.regenerate')}
    </Button>
  );
};
