import { ArrowLeft, Clock, Columns2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LevelBadge, type Article } from '@/entities/article';
import { FileTypeBadge } from '@/entities/document';
import { ROUTES } from '@/shared/config';
import { cn } from '@/shared/lib';
import { Badge, Button } from '@/shared/ui';

interface ArticleHeaderProps {
  article: Article;
  compare: boolean;
  canCompare: boolean;
  onCompareChange: (value: boolean) => void;
  /** The "tap any word" hint; only meaningful while reading. */
  showHint?: boolean;
  /** Slot for the mode switch, version selector and other page-level controls. */
  children?: React.ReactNode;
}

export const ArticleHeader = ({
  article,
  compare,
  canCompare,
  onCompareChange,
  showHint = true,
  children,
}: ArticleHeaderProps) => {
  const { t } = useTranslation();
  const { metadata } = article;
  return (
    <header className="flex flex-col gap-4">
      <Link
        to={ROUTES.documents}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex w-fit items-center gap-1.5 rounded text-sm focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft className="size-4" aria-hidden /> {t('reader.back')}
      </Link>
      <h1 className="text-fluid-3xl leading-tight font-semibold tracking-tight">{article.title}</h1>
      <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
        <FileTypeBadge type={metadata.fileType} />
        {metadata.estimatedLevel && (
          <span className="inline-flex items-center gap-1">
            <span className="sr-only">{t('reader.level')}:</span>
            <LevelBadge level={metadata.estimatedLevel} />
          </span>
        )}
        <Badge variant="outline">
          <Clock aria-hidden /> {t('documents.minutes', { count: metadata.readingMinutes })}
        </Badge>
        <span>{t('documents.words', { count: metadata.wordCount })}</span>
        {metadata.source && (
          <Badge variant="primary">{t('reader.source', { source: metadata.source })}</Badge>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">{children}</div>
        {canCompare && (
          <Button
            variant="outline"
            size="sm"
            aria-pressed={compare}
            onClick={() => onCompareChange(!compare)}
            className={cn('self-start', compare && 'border-primary text-primary')}
          >
            <Columns2 aria-hidden /> {t('reader.compareWith')}
          </Button>
        )}
      </div>
      {showHint && <p className="text-muted-foreground text-sm">{t('reader.hint')}</p>}
    </header>
  );
};
