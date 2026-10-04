import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CefrLevel } from '@/shared/config';
import { Button, QueryErrorState, TextSkeleton } from '@/shared/ui';
import { useGenerateVersion } from '../model/use-generate-version';

/** Shown in place of a version that hasn't been generated yet. */
export const GenerateVersionPrompt = ({
  articleId,
  level,
}: {
  articleId: string;
  level: CefrLevel;
}) => {
  const { t } = useTranslation();
  const generate = useGenerateVersion(articleId);
  const isThisLevel = generate.variables === level;

  if (generate.isPending && isThisLevel) {
    return (
      <div className="flex flex-col gap-6" aria-busy aria-live="polite">
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Sparkles
            className="text-primary size-4 animate-pulse motion-reduce:animate-none"
            aria-hidden
          />
          {t('reader.generating', { level })}
        </p>
        <TextSkeleton lines={5} />
        <TextSkeleton lines={4} />
      </div>
    );
  }

  // Keep the failure visible in place (with retry) instead of silently resetting the button.
  if (generate.isError && isThisLevel) {
    return <QueryErrorState error={generate.error} onRetry={() => generate.mutate(level)} />;
  }

  return (
    <div className="border-border flex flex-col items-center gap-4 rounded-2xl border border-dashed px-6 py-12 text-center">
      <Sparkles className="text-primary size-6" aria-hidden />
      <Button onClick={() => generate.mutate(level)}>{t('reader.generate', { level })}</Button>
    </div>
  );
};
