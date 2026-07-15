import { create } from 'zustand';

/**
 * Feature-local selection state for the client catalogue: which family is open,
 * which service sub-rows are ticked, and the current search query.
 */
interface CatalogueState {
  selectedFamily: string | null;
  selectedSubs: string[];
  catSearch: string;
}

export const useCatalogueStore = create<CatalogueState>()(() => ({
  selectedFamily: null,
  selectedSubs: [],
  catSearch: '',
}));

export const catalogueActions = {
  /** Open a family. Clears the sub selection when the family actually changes. */
  selectFamily: (id: string): void => {
    const { selectedFamily } = useCatalogueStore.getState();
    if (selectedFamily === id) return;
    useCatalogueStore.setState({ selectedFamily: id, selectedSubs: [] });
  },
  toggleSub: (subId: string): void => {
    const { selectedSubs } = useCatalogueStore.getState();
    useCatalogueStore.setState({
      selectedSubs: selectedSubs.includes(subId)
        ? selectedSubs.filter((s) => s !== subId)
        : [...selectedSubs, subId],
    });
  },
  clearSubs: (): void => {
    useCatalogueStore.setState({ selectedSubs: [] });
  },
  setCatSearch: (value: string): void => {
    useCatalogueStore.setState({ catSearch: value });
  },
};
