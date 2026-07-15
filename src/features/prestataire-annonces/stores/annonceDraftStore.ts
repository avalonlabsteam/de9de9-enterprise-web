import { create } from 'zustand';

/**
 * Holds the professionals selected for the annonce being created, so the choice
 * survives the round-trip CreateAnnoncePage → AssignAnnoncePage → back.
 */
interface AnnonceDraftState {
  selectedProIds: string[];
  setSelectedProIds: (ids: string[]) => void;
  reset: () => void;
}

export const useAnnonceDraftStore = create<AnnonceDraftState>((set) => ({
  selectedProIds: [],
  setSelectedProIds: (ids) => set({ selectedProIds: ids }),
  reset: () => set({ selectedProIds: [] }),
}));
