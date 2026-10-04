import { useEffect, type KeyboardEvent, type MouseEvent, type RefObject } from 'react';
import { useSelectionStore } from './selection-store';

const WORD_SELECTOR = '[data-word]';
const MAX_PHRASE_LENGTH = 300;
/** Mobile selection handles fire many events while dragging; wait until the user settles. */
const SELECTION_SETTLE_MS = 350;

const paragraphOf = (el: Element | null | undefined) =>
  el?.closest<HTMLElement>('[data-paragraph-id]') ?? null;

const selectWordElement = (el: HTMLElement) => {
  const paragraph = paragraphOf(el);
  useSelectionStore.getState().select({
    text: el.dataset.word!,
    kind: 'word',
    context: paragraph?.textContent ?? undefined,
    paragraphId: paragraph?.dataset.paragraphId,
    tokenIndex: Number(el.dataset.index),
  });
};

const readPhrase = (container: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.anchorNode) return null;
  if (!container.contains(selection.anchorNode)) return null;
  const text = selection.toString().replace(/\s+/g, ' ').trim();
  return text.includes(' ') && text.length <= MAX_PHRASE_LENGTH
    ? { text, anchor: selection.anchorNode }
    : null;
};

/**
 * Event delegation for the whole article: one listener instead of thousands.
 * - click / tap / Enter on a word → word selection
 * - arrow keys move a single roving tab stop between words
 */
export const articleSelectionHandlers = {
  onClick(event: MouseEvent<HTMLElement>) {
    if (readPhrase(event.currentTarget)) return; // a drag-selection, handled by usePhraseSelection
    const target = (event.target as HTMLElement).closest<HTMLElement>(WORD_SELECTOR);
    if (target) selectWordElement(target);
  },

  onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const target = (event.target as HTMLElement).closest<HTMLElement>(WORD_SELECTOR);
    if (!target) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectWordElement(target);
      return;
    }
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const words = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(WORD_SELECTOR));
    const next = words[words.indexOf(target) + step];
    if (next) {
      target.tabIndex = -1;
      next.tabIndex = 0;
      next.focus();
    }
  },
};

/** Multi-word selections (mouse drag or mobile long-press handles) become phrase selections. */
export const usePhraseSelection = (containerRef: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onSelectionChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const container = containerRef.current;
        const phrase = container && readPhrase(container);
        if (!phrase) return;
        const paragraph = paragraphOf(phrase.anchor.parentElement);
        useSelectionStore.getState().select({
          text: phrase.text,
          kind: 'phrase',
          context: paragraph?.textContent ?? undefined,
          paragraphId: paragraph?.dataset.paragraphId,
        });
      }, SELECTION_SETTLE_MS);
    };
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [containerRef]);
};
