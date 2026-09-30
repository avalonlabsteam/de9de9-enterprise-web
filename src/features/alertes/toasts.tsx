import { toast } from 'sonner';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { AlerteToast, ResumeToast } from './components/AlerteToast';
import { isOnScreen } from './lib/chemin';
import { toastDuration } from './lib/libelles';
import { openAlerte } from './open';
import type { Alerte } from './schemas/alerte';
import { alertesActions, useAlertesStore } from './stores/alertesStore';

/** More than 3 within 5 s is a burst: one summary toast instead (common guide §7.1). */
const BURST_WINDOW_MS = 5_000;
const BURST_MAX = 3;
const RESUME_ID = 'alertes-resume';

let recent: { at: number; id: string }[] = [];
let burst = 0;

function showResume(count: number): void {
  toast.custom(
    (id) => (
      <ResumeToast
        count={count}
        onOpen={() => {
          toast.dismiss(id);
          alertesActions.openDrawer();
        }}
        onClose={() => toast.dismiss(id)}
      />
    ),
    { id: RESUME_ID, duration: 6_000 },
  );
}

/**
 * A new alert from the hub. About the screen on display: no toast, that
 * screen's data is fetched again instead. Otherwise every cached screen is
 * marked stale (the alert says something changed), and the toast follows the
 * rules: an `info` stays quiet while the drawer is open, a burst folds into one.
 */
export function notifyLive(a: Alerte): void {
  const side = useAuthStore.getState().user?.role;
  if (side && isOnScreen(a.cible.chemin, side)) {
    void queryClient.invalidateQueries();
    return;
  }
  void queryClient.invalidateQueries({ refetchType: 'none' });
  if (a.ton === 'info' && useAlertesStore.getState().drawerOpen) return;

  const now = Date.now();
  recent = recent.filter((r) => now - r.at < BURST_WINDOW_MS);
  recent.push({ at: now, id: a.id });
  if (recent.length > BURST_MAX) {
    burst = burst === 0 ? recent.length : burst + 1;
    for (const r of recent) toast.dismiss(r.id);
    showResume(burst);
    return;
  }
  burst = 0;
  toast.custom(
    (id) => (
      <AlerteToast
        alerte={a}
        onOpen={() => {
          toast.dismiss(id);
          void openAlerte(a);
        }}
        onClose={() => toast.dismiss(id)}
      />
    ),
    { id: a.id, duration: toastDuration(a.ton) },
  );
}

/** What a catch-up brought: at most one toast for all of it. */
export function notifyCaughtUp(count: number): void {
  if (count <= 0) return;
  void queryClient.invalidateQueries({ refetchType: 'none' });
  if (!useAlertesStore.getState().drawerOpen) showResume(count);
}
