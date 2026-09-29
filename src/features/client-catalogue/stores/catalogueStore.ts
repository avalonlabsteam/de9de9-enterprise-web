import { create } from 'zustand';

/**
 * Feature-local selection state for « Nouvelle demande »: which category is open
 * (its code), which services are ticked (their codes — they become
 * `subCategoryCodes`), and the current search text.
 */
interface CatalogueState {
  selectedFamily: string | null;
  selectedSubs: string[];
  catSearch: string;
}

const initialState: CatalogueState = {
  selectedFamily: null,
  selectedSubs: [],
  catSearch: '',
};

// Imported by authStore (logout): must not import it back.
export const useCatalogueStore = create<CatalogueState>()(() => initialState);

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
  /** A search hit: open its category with that service already ticked. */
  openWithService: (categoryCode: string, serviceCode: string): void => {
    useCatalogueStore.setState({ selectedFamily: categoryCode, selectedSubs: [serviceCode], catSearch: '' });
  },
  clearSubs: (): void => {
    useCatalogueStore.setState({ selectedSubs: [] });
  },
  setCatSearch: (value: string): void => {
    useCatalogueStore.setState({ catSearch: value });
  },
  /** Nothing picked: the next account must not open on this one's search and picks. */
  reset: (): void => {
    useCatalogueStore.setState(initialState);
  },
};
