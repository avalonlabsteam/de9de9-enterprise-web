import { toast } from 'sonner';
import { toProblem } from '@/api/problem';
import { appNavigate } from '@/lib/navigation';
import { useAuthStore } from '@/stores/authStore';
import { switchRole } from '@/features/auth/api/session';
import { postLue, postLues } from './api/alertes';
import { appPath, cheminOf } from './lib/chemin';
import { lNow } from './lib/libelles';
import type { Alerte, Categorie } from './schemas/alerte';
import { alertesActions } from './stores/alertesStore';

/**
 * A tap on an alert, in the drawer or on its toast (common guide §8): mark it
 * read — at once on screen, then on the server — and open `cible.chemin`.
 */
export async function openAlerte(a: Alerte): Promise<void> {
  if (!a.lu) {
    alertesActions.markRead(a.id);
    postLue(a.id)
      .then((compteurs) => alertesActions.setCompteurs(compteurs))
      .catch((error: unknown) => {
        // 404: gone, or a row of the other side — nothing to undo.
        if (toProblem(error).status !== 404) alertesActions.unmarkRead([a.id]);
      });
  }

  const chemin = cheminOf(a);
  if (!chemin) return; // the row only informs

  let side = useAuthStore.getState().user?.role;
  if (!side) return;
  // A row is always listed on its own side; this guards a stale one.
  const target = a.cible.app;
  if ((target === 'client' || target === 'prestataire') && target !== side) {
    try {
      side = (await switchRole()).role;
    } catch {
      toast.error(lNow("Impossible de changer d'espace. Réessayez.", 'تعذّر تغيير المساحة. أعد المحاولة.'));
      return;
    }
  }
  alertesActions.closeDrawer();
  appNavigate(appPath(chemin, side));
}

/**
 * « Tout marquer comme lu » — the whole side, or only the chip selected.
 * Optimistic; undone when the server refused.
 */
export async function marquerToutLu(categorie: Categorie | null): Promise<void> {
  const ids = alertesActions.markAllRead(categorie);
  try {
    alertesActions.setCompteurs((await postLues(categorie)).compteurs);
  } catch (error) {
    alertesActions.unmarkRead(ids);
    toast.error(toProblem(error).detail ?? lNow("L'action n'a pas pu aboutir. Réessayez.", 'تعذّر تنفيذ الإجراء. أعد المحاولة.'));
  }
}
