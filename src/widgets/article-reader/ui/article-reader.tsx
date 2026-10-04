import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';
import { useVersionLabel, type Article, type VersionSlot } from '@/entities/article';
import { useSavedWordIndex } from '@/entities/vocabulary';
import { toReaderStyle, useReaderPreferences } from '@/features/customize-reader';
import { GenerateVersionPrompt } from '@/features/generate-simplification';
import { articleSelectionHandlers, usePhraseSelection } from '@/features/select-text';
import { useMediaQuery } from '@/shared/lib';
import { MEDIA } from '@/shared/config';
import { SegmentedControl } from '@/shared/ui';
import { VersionRenderer } from './version-renderers';

interface ArticleReaderProps {
  article: Article;
  slot: VersionSlot;
  compare: boolean;
}

const useSavedWordSet = () => {
  const { data } = useSavedWordIndex();
  return data ? new Set(data.keys()) : undefined;
};

const ReaderSurface = ({ children, label }: { children: React.ReactNode; label: string }) => {
  const prefs = useReaderPreferences(
    useShallow((s) => ({
      fontSize: s.fontSize,
      lineHeight: s.lineHeight,
      contentWidth: s.contentWidth,
      fontFamily: s.fontFamily,
    })),
  );
  const ref = useRef<HTMLDivElement>(null);
  usePhraseSelection(ref);
  return (
    <div
      ref={ref}
      role="document"
      aria-label={label}
      className="reader-prose"
      style={toReaderStyle(prefs)}
      onClick={articleSelectionHandlers.onClick}
      onKeyDown={articleSelectionHandlers.onKeyDown}
    >
      {children}
    </div>
  );
};

const SlotContent = ({
  article,
  slot,
  savedWords,
  isPrimary,
}: {
  article: Article;
  slot: VersionSlot;
  savedWords?: ReadonlySet<string>;
  isPrimary?: boolean;
}) =>
  slot.version ? (
    <VersionRenderer version={slot.version} savedWords={savedWords} isPrimary={isPrimary} />
  ) : slot.level ? (
    <GenerateVersionPrompt articleId={article.id} level={slot.level} />
  ) : null;

export const ArticleReader = ({ article, slot, compare }: ArticleReaderProps) => {
  const label = useVersionLabel();
  const savedWords = useSavedWordSet();
  const original = {
    id: 'original',
    type: 'original' as const,
    version: article.versions.find((v) => v.type === 'original'),
  };
  const showCompare = compare && slot.type !== 'original';

  if (showCompare)
    return (
      <ComparisonView article={article} original={original} slot={slot} savedWords={savedWords} />
    );

  return (
    <ReaderSurface label={label(slot)}>
      <SlotContent article={article} slot={slot} savedWords={savedWords} isPrimary />
    </ReaderSurface>
  );
};

/** Desktop: side-by-side columns. Mobile/tablet: toggle between the two (never squeezed). */
const ComparisonView = ({
  article,
  original,
  slot,
  savedWords,
}: {
  article: Article;
  original: VersionSlot;
  slot: VersionSlot;
  savedWords?: ReadonlySet<string>;
}) => {
  const { t } = useTranslation();
  const label = useVersionLabel();
  const isDesktop = useMediaQuery(MEDIA.desktop);
  const [side, setSide] = useState<'original' | 'version'>('version');

  if (!isDesktop) {
    return (
      <div className="flex flex-col gap-4">
        <SegmentedControl
          label={t('reader.compare')}
          value={side}
          onValueChange={setSide}
          className="self-start"
          options={[
            { value: 'original', label: t('reader.original') },
            { value: 'version', label: label(slot) },
          ]}
        />
        <ReaderSurface label={side === 'original' ? t('reader.original') : label(slot)}>
          <SlotContent
            article={article}
            slot={side === 'original' ? original : slot}
            savedWords={savedWords}
            isPrimary
          />
        </ReaderSurface>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-8">
      {[original, slot].map((s, i) => (
        <section key={s.id} aria-label={label(s)} className="min-w-0">
          <h2 className="text-muted-foreground mb-4 text-xs font-semibold tracking-wide uppercase">
            {label(s)}
          </h2>
          <ReaderSurface label={label(s)}>
            <SlotContent article={article} slot={s} savedWords={savedWords} isPrimary={i === 0} />
          </ReaderSurface>
        </section>
      ))}
    </div>
  );
};
