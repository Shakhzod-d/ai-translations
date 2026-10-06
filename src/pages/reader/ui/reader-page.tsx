import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArticleSkeleton, buildVersionSlots, findSlot, useArticle } from '@/entities/article';
import { DEFAULT_EXERCISE_LEVEL } from '@/entities/exercise';
import { AiSetupBanner } from '@/features/configure-ai';
import { useMarkDocumentOpened } from '@/features/manage-document';
import { useSelectionStore } from '@/features/select-text';
import { toApiError } from '@/shared/api';
import { CEFR_LEVELS, ROUTES, type CefrLevel } from '@/shared/config';
import { BookOpen, ListChecks } from 'lucide-react';
import { buttonVariants, EmptyState, QueryErrorState, SegmentedControl } from '@/shared/ui';
import { ArticleHeader } from '@/widgets/article-header';
import { ArticleNavigation } from '@/widgets/article-navigation';
import { ArticleExercises } from '@/widgets/article-exercises';
import { ArticleReader } from '@/widgets/article-reader';
import { ArticleVersionSelector } from '@/widgets/article-version-selector';
import { AdaptiveLearningPanel } from '@/widgets/learning-panel';

const VERSION_PARAM = 'v';
const COMPARE_PARAM = 'compare';
const MODE_PARAM = 'mode';
const EXERCISE_LEVEL_PARAM = 'xl';

type ReaderMode = 'read' | 'exercises';
const isLevel = (value: string | null): value is CefrLevel =>
  (CEFR_LEVELS as readonly (string | null)[]).includes(value);

/**
 * Layout:
 * - mobile:  single column; learning info in a bottom sheet
 * - tablet:  article + collapsible learning column
 * - desktop: outline | article | learning panel
 * Exercises mode: one centered column at every size, so tasks get the full width.
 */
const ReaderPage = () => {
  const { t } = useTranslation();
  const { articleId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { data: article, isPending, error, refetch } = useArticle(articleId);
  const clearSelection = useSelectionStore((s) => s.clear);

  useMarkDocumentOpened(article?.id);
  useEffect(() => clearSelection, [articleId, clearSelection]);

  const shell = (children: React.ReactNode) => (
    <div className="mx-auto w-full max-w-[100rem] px-4 py-6 sm:px-6 lg:py-8">{children}</div>
  );

  if (isPending)
    return shell(
      <div className="mx-auto max-w-3xl">
        <ArticleSkeleton />
      </div>,
    );
  if (error) {
    return shell(
      toApiError(error).code === 'NOT_FOUND' ? (
        <EmptyState
          title={t('errors.NOT_FOUND')}
          description={t('reader.notFound')}
          action={
            <Link to={ROUTES.documents} className={buttonVariants()}>
              {t('reader.back')}
            </Link>
          }
        />
      ) : (
        <QueryErrorState error={error} onRetry={() => void refetch()} />
      ),
    );
  }

  const slots = buildVersionSlots(article.versions);
  const slot = findSlot(slots, params.get(VERSION_PARAM));
  const compare = params.get(COMPARE_PARAM) === '1';
  const mode: ReaderMode = params.get(MODE_PARAM) === 'exercises' ? 'exercises' : 'read';
  const requestedLevel = params.get(EXERCISE_LEVEL_PARAM);
  // Default to the level being read, else a level that already has exercises.
  const exerciseLevel = isLevel(requestedLevel)
    ? requestedLevel
    : (slot.level ?? article.exercises[0]?.level ?? DEFAULT_EXERCISE_LEVEL);
  const updateParam = (key: string, value: string | null) =>
    setParams(
      (p) => {
        if (value === null) p.delete(key);
        else p.set(key, value);
        return p;
      },
      { replace: true },
    );

  const modeSwitch = (
    <SegmentedControl<ReaderMode>
      label={t('exercises.mode')}
      value={mode}
      onValueChange={(m) => updateParam(MODE_PARAM, m === 'read' ? null : m)}
      options={[
        { value: 'read', label: t('exercises.readTab'), icon: <BookOpen aria-hidden /> },
        { value: 'exercises', label: t('exercises.tab'), icon: <ListChecks aria-hidden /> },
      ]}
      className="w-full sm:w-fit"
    />
  );

  if (mode === 'exercises') {
    return shell(
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <ArticleHeader
          article={article}
          compare={false}
          canCompare={false}
          showHint={false}
          onCompareChange={() => undefined}
        >
          {modeSwitch}
        </ArticleHeader>
        <AiSetupBanner />
        <ArticleExercises
          article={article}
          level={exerciseLevel}
          onLevelChange={(level) => updateParam(EXERCISE_LEVEL_PARAM, level)}
        />
      </div>,
    );
  }

  return shell(
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[14rem_minmax(0,1fr)_22rem] lg:gap-8 2xl:grid-cols-[16rem_minmax(0,1fr)_26rem]">
      <div className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto">
          <ArticleNavigation version={slot.version ?? article.versions[0]} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-8">
        <ArticleHeader
          article={article}
          compare={compare}
          canCompare={slot.type !== 'original'}
          onCompareChange={(v) => updateParam(COMPARE_PARAM, v ? '1' : null)}
        >
          <div className="flex flex-col gap-3">
            {modeSwitch}
            <ArticleVersionSelector
              slots={slots}
              value={slot.id}
              onChange={(id) => updateParam(VERSION_PARAM, id === 'original' ? null : id)}
            />
          </div>
        </ArticleHeader>
        <AiSetupBanner />
        <ArticleReader article={article} slot={slot} compare={compare} />
      </div>
      <div className="min-w-0">
        <AdaptiveLearningPanel article={article} />
      </div>
    </div>,
  );
};

export default ReaderPage;
