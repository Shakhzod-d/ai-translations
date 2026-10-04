import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArticleSkeleton, buildVersionSlots, findSlot, useArticle } from '@/entities/article';
import { AiSetupBanner } from '@/features/configure-ai';
import { useMarkDocumentOpened } from '@/features/manage-document';
import { useSelectionStore } from '@/features/select-text';
import { toApiError } from '@/shared/api';
import { ROUTES } from '@/shared/config';
import { buttonVariants, EmptyState, QueryErrorState } from '@/shared/ui';
import { ArticleHeader } from '@/widgets/article-header';
import { ArticleNavigation } from '@/widgets/article-navigation';
import { ArticleReader } from '@/widgets/article-reader';
import { ArticleVersionSelector } from '@/widgets/article-version-selector';
import { AdaptiveLearningPanel } from '@/widgets/learning-panel';

const VERSION_PARAM = 'v';
const COMPARE_PARAM = 'compare';

/**
 * Layout:
 * - mobile:  single column; learning info in a bottom sheet
 * - tablet:  article + collapsible learning column
 * - desktop: outline | article | learning panel
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
  const updateParam = (key: string, value: string | null) =>
    setParams(
      (p) => {
        if (value === null) p.delete(key);
        else p.set(key, value);
        return p;
      },
      { replace: true },
    );

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
          <ArticleVersionSelector
            slots={slots}
            value={slot.id}
            onChange={(id) => updateParam(VERSION_PARAM, id === 'original' ? null : id)}
          />
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
