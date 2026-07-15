import { create } from 'zustand';

export type B2cTab = 'recues' | 'explorer' | 'confirmes';
export type ExplorerPill = 'voirOffres' | 'offresEnvoyees';

interface B2cState {
  tab: B2cTab;
  explorerPill: ExplorerPill;
}

interface B2cActions {
  setTab: (tab: B2cTab) => void;
  setExplorerPill: (pill: ExplorerPill) => void;
}

export const useB2cStore = create<B2cState & B2cActions>((set) => ({
  tab: 'recues',
  explorerPill: 'voirOffres',
  setTab: (tab) => set({ tab }),
  setExplorerPill: (explorerPill) => set({ explorerPill }),
}));
