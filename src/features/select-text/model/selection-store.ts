import { create } from 'zustand';

export interface TextSelection {
  text: string;
  kind: 'word' | 'phrase';
  /** Sentence/paragraph the selection came from — sent to the AI for context-aware meaning. */
  context?: string;
  paragraphId?: string;
  tokenIndex?: number;
}

interface SelectionState {
  selection: TextSelection | null;
  select: (selection: TextSelection) => void;
  clear: () => void;
}

/** Shared between the article (producer) and the learning panel / sheet (consumers). */
export const useSelectionStore = create<SelectionState>((set) => ({
  selection: null,
  select: (selection) => set({ selection }),
  clear: () => set({ selection: null }),
}));
