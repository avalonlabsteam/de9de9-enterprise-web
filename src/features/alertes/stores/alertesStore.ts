import { create } from 'zustand';
import { useAuthStore } from '@/stores/authStore';
import type { Alerte, Categorie, Compteurs } from '../schemas/alerte';

/** The drawer's two tabs (common guide §7.2). */
export type Onglet = 'toutes' | 'non_lues';

/** What the drawer lists: a tab, and a chip or none. */
export interface Vue {
  onglet: Onglet;
  categorie: Categorie | null;
}

export const vueKey = (v: Vue): string => `${v.onglet}:${v.categorie ?? ''}`;
const TOUTES: Vue = { onglet: 'toutes', categorie: null };

/**
 * How far a view's own pages reached. The rows all live in one map, whatever
 * view fetched them; a view shows only down to its `horizon` (the oldest row
 * its pages brought) so an old row fetched by another view never shows past
 * a gap it has not loaded yet.
 */
export interface VuePages {
  page: number;
  horizon: string | null;
  /** The last page was reached. */
  fin: boolean;
}

interface AlertesState {
  /** Every alert held, by id — the dedupe (common guide §6.1). */
  byId: Record<string, Alerte>;
  /** The badge, the chips and the switcher dot — only ever from the server. */
  compteurs: Compteurs | null;
  pages: Record<string, VuePages>;
  drawerOpen: boolean;
  vue: Vue;
}

const initialState: AlertesState = { byId: {}, compteurs: null, pages: {}, drawerOpen: false, vue: TOUTES };

export const useAlertesStore = create<AlertesState>()(() => initialState);

const set = useAlertesStore.setState;
const get = useAlertesStore.getState;

/**
 * Bumped by `clear()`: an answer fetched for the previous session or side must
 * not land in this one.
 */
let generation = 0;
export const alertesGeneration = (): number => generation;

const ms = (iso: string): number => Date.parse(iso) || 0;

/** The server's order: newest first, then by id (descending). */
export function byNewest(x: Alerte, y: Alerte): number {
  return ms(y.creeLe) - ms(x.creeLe) || y.id.localeCompare(x.id);
}

/** The oldest `creeLe` of a page, or null for an empty one. */
function oldestOf(rows: Alerte[]): string | null {
  let oldest: string | null = null;
  for (const a of rows) if (oldest === null || ms(a.creeLe) < ms(oldest)) oldest = a.creeLe;
  return oldest;
}

/** Keep one row per id; a known row only moves forward — unread to read. */
function merged(byId: Record<string, Alerte>, rows: Alerte[]): Record<string, Alerte> {
  const next = { ...byId };
  for (const a of rows) {
    const known = next[a.id];
    if (!known || (a.lu && !known.lu)) next[a.id] = a;
  }
  return next;
}

function withRead(byId: Record<string, Alerte>, test: (a: Alerte) => boolean): Record<string, Alerte> {
  const now = new Date().toISOString();
  const next = { ...byId };
  for (const a of Object.values(byId)) if (!a.lu && test(a)) next[a.id] = { ...a, lu: true, luLe: now };
  return next;
}

/** The side this session is on, as `compteurs.app` and `cible.app` name it. */
export const currentApp = (): string | undefined => useAuthStore.getState().user?.role;

export const alertesActions = {
  /** True when the alert is new — a toast is then allowed. */
  add(a: Alerte): boolean {
    const known = get().byId[a.id];
    if (known) {
      if (a.lu && !known.lu) set({ byId: { ...get().byId, [a.id]: a } });
      return false;
    }
    set({ byId: { ...get().byId, [a.id]: a } });
    return true;
  },

  /** A page of one view: its rows join the rest; its reach moves on (never back). */
  addPage(vue: Vue, rows: Alerte[], page: number, hasMore: boolean): void {
    const key = vueKey(vue);
    set((s) => {
      let byId = merged(s.byId, rows);
      if (vue.onglet === 'non_lues' && rows.length > 0) {
        // An unread row held in the span of this unread-only page, yet not in
        // it, was read meanwhile — on another seat of this side.
        const inPage = new Set(rows.map((a) => a.id));
        const newest = Math.max(...rows.map((a) => ms(a.creeLe)));
        const floor = hasMore ? Math.min(...rows.map((a) => ms(a.creeLe))) : -Infinity;
        byId = withRead(
          byId,
          (a) =>
            !inPage.has(a.id) &&
            (vue.categorie === null || a.categorie === vue.categorie) &&
            ms(a.creeLe) >= floor &&
            ms(a.creeLe) <= newest,
        );
      }
      const prev = s.pages[key];
      if (prev && page <= prev.page) return { byId };
      const horizon = oldestOf(rows) ?? prev?.horizon ?? null;
      return { byId, pages: { ...s.pages, [key]: { page, horizon, fin: !hasMore } } };
    });
  },

  /** First load, or back from too long away: this list, and every view starts over. */
  replace(rows: Alerte[], hasMore: boolean): void {
    set({
      byId: merged({}, rows),
      pages: { [vueKey(TOUTES)]: { page: 1, horizon: oldestOf(rows), fin: !hasMore } },
    });
  },

  /** Signed out, or another side: alerts and `cible` are per side — never kept. */
  clear(): void {
    generation += 1;
    set(initialState);
  },

  markRead(id: string): void {
    set((s) => ({ byId: withRead(s.byId, (a) => a.id === id) }));
  },

  unmarkRead(ids: string[]): void {
    set((s) => {
      const byId = { ...s.byId };
      for (const id of ids) {
        const a = byId[id];
        if (a) byId[id] = { ...a, lu: false, luLe: null };
      }
      return { byId };
    });
  },

  /** « Tout marquer comme lu », optimistic. Answers the ids it changed, to undo on failure. */
  markAllRead(categorie: Categorie | null): string[] {
    const ids = Object.values(get().byId)
      .filter((a) => !a.lu && (categorie === null || a.categorie === categorie))
      .map((a) => a.id);
    set((s) => ({ byId: withRead(s.byId, (a) => ids.includes(a.id)) }));
    return ids;
  },

  /**
   * New numbers. Another side's are ignored (a switch in flight). `infer` —
   * for the hub's, which follow the alerts on the same socket — also marks
   * read what the numbers say is read: nothing unread left in a chip means
   * every row of that chip was read, on some seat of this side.
   */
  setCompteurs(c: Compteurs, opts: { infer?: boolean } = {}): void {
    if (c.app !== currentApp()) return;
    if (!opts.infer) {
      set({ compteurs: c });
      return;
    }
    const cleared = new Set(Object.entries(c.parCategorie).filter(([, n]) => n === 0).map(([cat]) => cat));
    set((s) => ({
      compteurs: c,
      byId: withRead(s.byId, (a) => c.nonLues === 0 || cleared.has(a.categorie)),
    }));
  },

  openDrawer(): void {
    set({ drawerOpen: true });
  },
  closeDrawer(): void {
    set({ drawerOpen: false });
  },
  setVue(vue: Vue): void {
    set({ vue });
  },
};

/** The newest `creeLe` held — the catch-up cursor. */
export function newestCreeLe(): string | null {
  let newest: string | null = null;
  for (const a of Object.values(get().byId)) if (newest === null || ms(a.creeLe) > ms(newest)) newest = a.creeLe;
  return newest;
}

export const unreadHeld = (): number => Object.values(get().byId).filter((a) => !a.lu).length;

/** A view's rows: its filter, newest first, down to how far its own pages reached. */
export function rowsOf(byId: Record<string, Alerte>, vue: Vue, pages: VuePages | undefined): Alerte[] {
  if (!pages) return [];
  const floor = !pages.fin && pages.horizon ? ms(pages.horizon) : -Infinity;
  return Object.values(byId)
    .filter(
      (a) =>
        (vue.onglet === 'toutes' || !a.lu) &&
        (vue.categorie === null || a.categorie === vue.categorie) &&
        ms(a.creeLe) >= floor,
    )
    .sort(byNewest);
}
