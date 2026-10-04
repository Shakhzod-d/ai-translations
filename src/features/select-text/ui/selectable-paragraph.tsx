import { memo, useMemo } from 'react';
import { cn, normalizeWord, tokenize } from '@/shared/lib';

interface SelectableParagraphProps {
  id: string;
  text: string;
  /** Normalized saved words; changes only when vocabulary changes. */
  savedWords?: ReadonlySet<string>;
  /** Only passed to the paragraph containing the selection, so other paragraphs skip re-rendering. */
  selectedIndex?: number;
  /** Exactly one word in the article should be tabbable (roving tabindex). */
  isFirst?: boolean;
  className?: string;
}

export const SelectableParagraph = memo(
  ({ id, text, savedWords, selectedIndex, isFirst, className }: SelectableParagraphProps) => {
    const tokens = useMemo(() => tokenize(text), [text]);
    let firstWordSeen = false;
    return (
      <p data-paragraph-id={id} className={cn('reader-paragraph', className)}>
        {tokens.map((token) => {
          if (token.kind !== 'word') return token.value;
          const tabbable = isFirst && !firstWordSeen;
          firstWordSeen = true;
          const saved = savedWords?.has(normalizeWord(token.value));
          return (
            <span
              key={token.index}
              role="button"
              tabIndex={tabbable ? 0 : -1}
              data-word={token.value}
              data-index={token.index}
              data-saved={saved || undefined}
              aria-pressed={selectedIndex === token.index}
              className="reader-word"
            >
              {token.value}
            </span>
          );
        })}
      </p>
    );
  },
);
SelectableParagraph.displayName = 'SelectableParagraph';
