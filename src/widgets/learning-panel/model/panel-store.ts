import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface LearningPanelState {
  /** Tablet only: whether the collapsible side column is expanded. */
  tabletOpen: boolean;
  setTabletOpen: (open: boolean) => void;
}

export const useLearningPanelStore = create<LearningPanelState>()(
  persist((set) => ({ tabletOpen: true, setTabletOpen: (tabletOpen) => set({ tabletOpen }) }), {
    name: 'lr.learning-panel',
    storage: createJSONStorage(() => localStorage),
  }),
);
