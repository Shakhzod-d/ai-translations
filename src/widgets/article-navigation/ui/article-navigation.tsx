import { useTranslation } from 'react-i18next';
import type { ArticleVersion } from '@/entities/article';

const PREVIEW_LENGTH = 48;

/** Desktop-only outline: jump to any paragraph. */
export const ArticleNavigation = ({ version }: { version?: ArticleVersion }) => {
  const { t } = useTranslation();
  if (!version) return null;
  return (
    <nav aria-label={t('reader.outline')} className="flex flex-col gap-2">
      <h2 className="text-muted-foreground px-2 text-xs font-semibold tracking-wide uppercase">
        {t('reader.outline')}
      </h2>
      <ol className="flex flex-col gap-0.5">
        {version.content.paragraphs.map((p, i) => (
          <li key={p.id}>
            <a
              href={`#${version.id}:${p.id}`}
              onClick={(e) => {
                e.preventDefault();
                document
                  .querySelector(`[data-paragraph-id="${CSS.escape(`${version.id}:${p.id}`)}"]`)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring block rounded-md px-2 py-1.5 text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="mr-1.5 text-xs tabular-nums">{i + 1}.</span>
              <span className="sr-only">{t('reader.paragraph', { n: i + 1 })}: </span>
              {p.text.length > PREVIEW_LENGTH ? `${p.text.slice(0, PREVIEW_LENGTH)}…` : p.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};
