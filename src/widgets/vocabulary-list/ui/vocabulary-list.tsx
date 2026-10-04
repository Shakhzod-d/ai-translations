import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { BookOpen } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_VOCABULARY_FILTERS,
  filterVocabulary,
  useVocabulary,
  VocabularyCard,
  type VocabularyFilters,
  type VocabularyItem,
} from '@/entities/vocabulary';
import { RemoveWordButton } from '@/features/save-vocabulary';
import { useDebouncedValue } from '@/shared/lib';
import { EmptyState, QueryErrorState, Skeleton } from '@/shared/ui';
import { VocabularyFiltersBar } from './vocabulary-filters-bar';

/** Above this size the list switches to window virtualization. */
const VIRTUALIZE_THRESHOLD = 80;

const VirtualList = ({ items }: { items: VocabularyItem[] }) => {
  const listRef = useRef<HTMLUListElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => setScrollMargin(listRef.current?.offsetTop ?? 0), []);
  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => 168,
    overscan: 6,
    scrollMargin,
  });
  return (
    <ul ref={listRef} className="relative" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((row) => {
        const item = items[row.index]!;
        return (
          <li
            key={item.id}
            data-index={row.index}
            ref={virtualizer.measureElement}
            className="absolute inset-x-0 pb-3"
            style={{ transform: `translateY(${row.start - virtualizer.options.scrollMargin}px)` }}
          >
            <VocabularyCard item={item} actions={<RemoveWordButton item={item} />} />
          </li>
        );
      })}
    </ul>
  );
};

export const VocabularyList = () => {
  const { t } = useTranslation();
  const { data, isPending, error, refetch } = useVocabulary();
  const [filters, setFilters] = useState<VocabularyFilters>(DEFAULT_VOCABULARY_FILTERS);
  const search = useDebouncedValue(filters.search);

  if (isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }
  if (error) return <QueryErrorState error={error} onRetry={() => void refetch()} />;
  if (data.length === 0)
    return (
      <EmptyState
        icon={<BookOpen />}
        title={t('vocabulary.empty')}
        description={t('vocabulary.emptyBody')}
      />
    );

  const visible = filterVocabulary(data, { ...filters, search });
  return (
    <div className="flex flex-col gap-4">
      <VocabularyFiltersBar
        filters={filters}
        onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
      />
      <p className="text-muted-foreground text-sm" aria-live="polite">
        {t('vocabulary.count', { count: visible.length })}
      </p>
      {visible.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center text-sm">
          {t('vocabulary.noMatches')}
        </p>
      ) : visible.length > VIRTUALIZE_THRESHOLD ? (
        <VirtualList items={visible} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <li key={item.id}>
              <VocabularyCard item={item} actions={<RemoveWordButton item={item} />} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
