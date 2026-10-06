import { BookOpen, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Article } from '@/entities/article';
import { findExerciseSet } from '@/entities/exercise';
import { GenerateExercisesPrompt, RegenerateExercisesButton } from '@/features/generate-exercises';
import { ExercisePractice } from '@/features/practice-exercises';
import { CEFR_LEVELS, type CefrLevel } from '@/shared/config';
import { SegmentedControl } from '@/shared/ui';

interface ArticleExercisesProps {
  article: Article;
  level: CefrLevel;
  onLevelChange: (level: CefrLevel) => void;
}

/** The text the tasks are about, collapsible so learners can look back while answering. */
const SourceText = ({ article, level }: { article: Article; level: CefrLevel }) => {
  const { t } = useTranslation();
  const leveled = article.versions.find((v) => v.level === level);
  const version = leveled ?? article.versions.find((v) => v.type === 'original');
  if (!version) return null;
  return (
    <details className="border-border bg-card group rounded-xl border">
      <summary className="hover:bg-muted flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium">
        <BookOpen className="text-primary size-4" aria-hidden />
        {t('exercises.showText')}
      </summary>
      <div className="flex max-h-[60dvh] flex-col gap-3 overflow-y-auto px-4 pb-4 leading-relaxed">
        {!leveled && (
          <p className="text-muted-foreground text-sm">
            {t('exercises.basedOnOriginal', { level })}
          </p>
        )}
        {version.content.paragraphs.map((p) => (
          <p key={p.id}>{p.text}</p>
        ))}
      </div>
    </details>
  );
};

export const ArticleExercises = ({ article, level, onLevelChange }: ArticleExercisesProps) => {
  const { t } = useTranslation();
  const set = findExerciseSet(article.exercises, level);
  const levelOptions = CEFR_LEVELS.map((l) => ({
    value: l,
    label: l,
    // Marks levels that already have exercises.
    icon: findExerciseSet(article.exercises, l) ? (
      <CheckCircle2 className="text-success" aria-hidden />
    ) : undefined,
  }));

  return (
    <section className="flex flex-col gap-6" aria-label={t('exercises.title')}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          label={t('exercises.level')}
          value={level}
          onValueChange={onLevelChange}
          options={levelOptions}
          className="w-full sm:w-fit"
        />
        {set && <RegenerateExercisesButton articleId={article.id} level={level} />}
      </div>
      <SourceText article={article} level={level} />
      {set ? (
        // Keyed by set: new or regenerated exercises always start with a clean attempt.
        <ExercisePractice key={set.id} set={set} />
      ) : (
        <GenerateExercisesPrompt articleId={article.id} level={level} />
      )}
    </section>
  );
};
