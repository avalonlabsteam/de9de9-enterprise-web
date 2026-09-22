import { create } from 'zustand';

/**
 * Holds the professionals selected for the annonce being created, so the choice
 * survives the AssignAnnonceModal round-trip inside the create flow. The flow
 * resets it on mount so an abandoned draft never leaks into the next one.
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
