import type { ComponentType } from 'react';
import type { ArticleVersion } from '@/entities/article';
import { SelectableParagraph, useSelectionStore } from '@/features/select-text';

export interface VersionRendererProps {
  version: ArticleVersion;
  savedWords?: ReadonlySet<string>;
  isPrimary?: boolean;
}

const paragraphKey = (version: ArticleVersion, paragraphId: string) =>
  `${version.id}:${paragraphId}`;

/** Default renderer: interactive paragraphs. */
const ParagraphsRenderer = ({ version, savedWords, isPrimary = true }: VersionRendererProps) => {
  // Select primitive values only, so a selection change re-renders just the affected paragraph.
  const selectedParagraph = useSelectionStore((s) => s.selection?.paragraphId);
  const selectedIndex = useSelectionStore((s) => s.selection?.tokenIndex);
  return (
    <>
      {version.content.paragraphs.map((p, i) => {
        const key = paragraphKey(version, p.id);
        return (
          <SelectableParagraph
            key={key}
            id={key}
            text={p.text}
            savedWords={savedWords}
            isFirst={isPrimary && i === 0}
            selectedIndex={selectedParagraph === key ? selectedIndex : undefined}
          />
        );
      })}
    </>
  );
};

/**
 * Renderer registry. A new mode (grammar focus, summary with bullets…) registers a component
 * here; the reader, selector and page do not change.
 */
const RENDERERS: Partial<Record<ArticleVersion['type'], ComponentType<VersionRendererProps>>> = {};

export const VersionRenderer = (props: VersionRendererProps) => {
  const Renderer = RENDERERS[props.version.type] ?? ParagraphsRenderer;
  return <Renderer {...props} />;
};
