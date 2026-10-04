import { FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useArticles, type ArticleSummary } from '@/entities/article';
import { useDebouncedValue } from '@/shared/lib';
import { EmptyState, QueryErrorState, SearchField, SegmentedControl, Skeleton } from '@/shared/ui';
import { DocumentCard } from './document-card';

type LibraryFilter = 'all' | 'favorites';

const filterDocuments = (docs: ArticleSummary[], search: string, filter: LibraryFilter) => {
  const q = search.trim().toLocaleLowerCase();
  return docs.filter(
    (d) =>
      (filter === 'all' || d.metadata.favorite) &&
      (!q ||
        d.title.toLocaleLowerCase().includes(q) ||
        d.metadata.fileName.toLocaleLowerCase().includes(q)),
  );
};

const GRID = 'grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4';

export const DocumentGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className={GRID} aria-hidden>
    {Array.from({ length: count }, (_, i) => (
      <Skeleton key={i} className="h-36 rounded-xl" />
    ))}
  </div>
);

export const DocumentLibrary = ({ emptyAction }: { emptyAction?: React.ReactNode }) => {
  const { t } = useTranslation();
  const { data, isPending, error, refetch } = useArticles();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<LibraryFilter>('all');
  const debouncedSearch = useDebouncedValue(search);

  if (isPending) return <DocumentGridSkeleton />;
  if (error) return <QueryErrorState error={error} onRetry={() => void refetch()} />;
  if (data.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen />}
        title={t('documents.empty')}
        description={t('documents.emptyBody')}
        action={emptyAction}
      />
    );
  }

  const visible = filterDocuments(data, debouncedSearch, filter);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchField
          value={search}
          onChange={setSearch}
          label={t('documents.search')}
          className="sm:max-w-xs sm:flex-1"
        />
        <SegmentedControl
          label={t('documents.filterAll')}
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: 'all', label: t('documents.filterAll') },
            { value: 'favorites', label: t('documents.filterFavorites') },
          ]}
        />
      </div>
      {visible.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {t('documents.noMatches')}
        </p>
      ) : (
        <ul className={GRID}>
          {visible.map((doc) => (
            <li key={doc.id}>
              <DocumentCard document={doc} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const RECENT_COUNT = 3;

export const RecentDocuments = () => {
  const { t } = useTranslation();
  const { data, isPending, error, refetch } = useArticles();
  if (isPending) return <DocumentGridSkeleton count={RECENT_COUNT} />;
  if (error) return <QueryErrorState error={error} onRetry={() => void refetch()} />;
  const recent = [...data]
    .sort((a, b) =>
      (b.metadata.lastOpenedAt ?? b.createdAt).localeCompare(
        a.metadata.lastOpenedAt ?? a.createdAt,
      ),
    )
    .slice(0, RECENT_COUNT);
  if (recent.length === 0)
    return <p className="text-muted-foreground text-sm">{t('home.emptyRecent')}</p>;
  return (
    <ul className={GRID}>
      {recent.map((doc) => (
        <li key={doc.id}>
          <DocumentCard document={doc} />
        </li>
      ))}
    </ul>
  );
};
