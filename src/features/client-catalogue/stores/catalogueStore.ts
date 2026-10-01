import { create } from 'zustand';

/**
 * The offer a demande is asked from (« Demander un devis », guide 19b §11): it
 * travels with the demande as `annonceId`, narrows the form's wilayas and adds
 * the locked line « Prestataire souhaité ».
 */
export interface OffreSouhaitee {
  annonceId: string;
  categoryCode: string;
  /** The wilayas the offer covers; empty = no narrowing. */
  wilayas: string[];
  /** « Prestataire souhaité : Cleanium » */
  prestataireSouhaite: string;
  note: string | null;
}

/**
 * Feature-local selection state for « Nouvelle demande »: which category is open
 * (its code), which services are ticked (their codes — they become
 * `subCategoryCodes`), the offer the demande comes from, and the current
 * search text.
 */
interface CatalogueState {
  selectedFamily: string | null;
  selectedSubs: string[];
  offre: OffreSouhaitee | null;
  catSearch: string;
}

const initialState: CatalogueState = {
  selectedFamily: null,
  selectedSubs: [],
  offre: null,
  catSearch: '',
};

// Imported by authStore (logout): must not import it back.
export const useCatalogueStore = create<CatalogueState>()(() => initialState);

export const catalogueActions = {
  /** Open a family. Clears the sub selection when the family actually changes. */
  selectFamily: (id: string): void => {
    const { selectedFamily } = useCatalogueStore.getState();
    if (selectedFamily === id) return;
    useCatalogueStore.setState({ selectedFamily: id, selectedSubs: [], offre: null });
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
    useCatalogueStore.setState({ selectedFamily: categoryCode, selectedSubs: [serviceCode], offre: null, catSearch: '' });
  },
  /** « Demander un devis » on an offer: its category, with its services ticked and the offer attached. */
  openWithOffre: (offre: OffreSouhaitee, serviceCodes: string[]): void => {
    useCatalogueStore.setState({ selectedFamily: offre.categoryCode, selectedSubs: serviceCodes, offre });
  },
  /** The demande goes on without a wished prestataire. */
  clearOffre: (): void => {
    useCatalogueStore.setState({ offre: null });
  },
  /** The demande was sent: its ticks and its offer are done with. */
  clearSubs: (): void => {
    useCatalogueStore.setState({ selectedSubs: [], offre: null });
  },
  setCatSearch: (value: string): void => {
    useCatalogueStore.setState({ catSearch: value });
  },
  /** Nothing picked: the next account must not open on this one's search and picks. */
  reset: (): void => {
    useCatalogueStore.setState(initialState);
  },
};
