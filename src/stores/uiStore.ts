import { create } from 'zustand';

/**
 * Ephemeral, cross-feature UI state. Feature-scoped modals (Affecter, Approve,
 * Contest, …) stay in local component state; only genuinely global overlays live
 * here (the Support sheet). Document/worker viewers are driven by search params
 * (see components/layout/overlayHosts.tsx).
 */
interface UiState {
  supportOpen: boolean;
}

export const useUiStore = create<UiState>()(() => ({ supportOpen: false }));

export const uiActions = {
  openSupport: (): void => {
    useUiStore.setState({ supportOpen: true });
  },
  closeSupport: (): void => {
    useUiStore.setState({ supportOpen: false });
  },
};
