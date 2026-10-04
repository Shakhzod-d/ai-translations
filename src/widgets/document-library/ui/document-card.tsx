import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LevelBadge, type ArticleSummary } from '@/entities/article';
import { FileTypeBadge } from '@/entities/document';
import { DocumentActionsMenu, ToggleFavoriteButton } from '@/features/manage-document';
import { buildReaderPath } from '@/shared/config';
import { formatRelativeTime } from '@/shared/lib';
import { Badge, Card } from '@/shared/ui';

export const DocumentCard = ({ document }: { document: ArticleSummary }) => {
  const { t, i18n } = useTranslation();
  const { metadata } = document;
  const level = metadata.estimatedLevel;
  return (
    <Card className="group focus-within:ring-ring relative flex h-full flex-col gap-3 p-4 transition-shadow focus-within:ring-2 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 leading-snug font-semibold">
          {/* Stretched link: the whole card is clickable, while action buttons stay separate tab stops. */}
          <Link
            to={buildReaderPath(document.id)}
            className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
          >
            {document.title}
          </Link>
        </h3>
        <div className="relative z-10 -mt-1 -mr-1 flex shrink-0">
          <ToggleFavoriteButton document={document} />
          <DocumentActionsMenu document={document} />
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <FileTypeBadge type={metadata.fileType} />
        <Badge variant="outline">{document.language.toUpperCase()}</Badge>
        {level && <LevelBadge level={level} />}
      </div>
      <p className="text-muted-foreground mt-auto text-xs">
        {metadata.lastOpenedAt
          ? t('documents.lastOpened', {
              when: formatRelativeTime(metadata.lastOpenedAt, i18n.language),
            })
          : t('documents.neverOpened')}
        {' · '}
        {t('documents.minutes', { count: metadata.readingMinutes })}
      </p>
    </Card>
  );
};
