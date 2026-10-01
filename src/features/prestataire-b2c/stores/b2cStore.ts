import { create } from 'zustand';

export type ExplorerPill = 'voirOffres' | 'offresEnvoyees';

/** Which half of « Explorer les offres » is open — kept while moving between tabs. The tab itself lives in the URL. */
interface B2cState {
  explorerPill: ExplorerPill;
  setExplorerPill: (pill: ExplorerPill) => void;
}

export const useB2cStore = create<B2cState>((set) => ({
  explorerPill: 'voirOffres',
  setExplorerPill: (explorerPill) => set({ explorerPill }),
}));
