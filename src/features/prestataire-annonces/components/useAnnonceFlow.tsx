import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { refreshAccueil } from '@/features/auth/api/accueil';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { annonceKey, annonceRecue, annoncesListeKey, etapesOf, executerAction } from '../api/annonces';
import { annonceErreur } from '../lib/erreurs';
import type { AnnonceAction, Confirmation, EtapeRefus } from '../schemas/annonces';

/** What an action needs of the annonce it is pressed on. */
export interface AnnonceRef {
  id: string;
  version: number;
}

const LISTE = '/prestataire/annonces';

export const createPath = (type: string) => `/prestataire/annonce/create?type=${encodeURIComponent(type)}`;
export const detailPath = (id: string) => `/prestataire/annonces/${encodeURIComponent(id)}`;
export const editPath = (id: string) => `${detailPath(id)}/modifier`;

/** What the edit screen is told when a submission was refused as incomplete. */
export interface EditState {
  etapes?: EtapeRefus[];
}

/**
 * The buttons of an annonce (`actions[]`), pressed the same way from the list
 * and from the detail. Only what the backend listed is drawn; a press opens
 * the form (« Modifier »), asks the confirmation the action carries, or sends.
 * The answer is the annonce: it replaces the one on screen.
 */
export function useAnnonceFlow({ onDeleted }: { onDeleted?: () => void } = {}) {
  const L = useL();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [asking, setAsking] = useState<{ annonce: AnnonceRef; action: AnnonceAction } | null>(null);
  const [sent, setSent] = useState<{ id: string; confirmation: Confirmation } | null>(null);
  const [kycRequis, setKycRequis] = useState<string | null>(null);

  const recharger = (id: string) => {
    void queryClient.invalidateQueries({ queryKey: annonceKey(id) });
    void queryClient.invalidateQueries({ queryKey: annoncesListeKey });
  };

  /** Shared with the forms: a refusal of « soumettre » reads the same everywhere. */
  const refus = (error: unknown, id: string) => {
    const { problem, message, recharger: stale } = annonceErreur(error, L);
    if (problem.code === 'kyc_required') {
      setKycRequis(problem.detail ?? L('Vérifiez votre entreprise pour publier une annonce.', 'وثّق مؤسستك لنشر إعلان.'));
      return;
    }
    if (problem.code === 'annonce_not_found') {
      // Deleted by another seat meanwhile: nothing of it is kept, and no screen stays open on it.
      toast.error(L('Cette annonce est introuvable.', 'هذا الإعلان غير موجود.'));
      queryClient.removeQueries({ queryKey: annonceKey(id) });
      void queryClient.invalidateQueries({ queryKey: annoncesListeKey });
      if (onDeleted) onDeleted();
      else if (location.pathname !== LISTE) navigate(LISTE, { replace: true });
      return;
    }
    toast.error(message);
    if (problem.code === 'annonce_incomplete') {
      // The form opens on what is missing.
      navigate(editPath(id), { state: { etapes: etapesOf(error) } satisfies EditState });
      return;
    }
    if (stale) recharger(id);
  };

  const run = async (annonce: AnnonceRef, action: AnnonceAction) => {
    setBusy(`${annonce.id}:${action.code}`);
    try {
      const result = await executerAction(action, annonce.version);
      switch (result.kind) {
        case 'supprimee':
          queryClient.removeQueries({ queryKey: annonceKey(annonce.id) });
          void queryClient.invalidateQueries({ queryKey: annoncesListeKey });
          toast.success(L('Annonce supprimée', 'تم حذف الإعلان'));
          onDeleted?.();
          break;
        case 'copie':
          // A new draft of the same kind: the form opens on it.
          annonceRecue(queryClient, result.annonce);
          navigate(editPath(result.annonce.id));
          return;
        case 'soumise':
          annonceRecue(queryClient, result.annonce);
          if (result.confirmation) setSent({ id: result.annonce.id, confirmation: result.confirmation });
          break;
        case 'annonce':
          annonceRecue(queryClient, result.annonce);
          break;
      }
      // Published, paused, resumed, archived: the home's block lists the published annonces.
      void refreshAccueil();
    } catch (error) {
      refus(error, annonce.id);
    } finally {
      setBusy(null);
      setAsking(null);
    }
  };

  const press = (annonce: AnnonceRef, action: AnnonceAction) => {
    // « Modifier » has no call: it opens the form (the wizard, for a B2C annonce).
    if (action.code === 'modifier' || !action.href) {
      navigate(editPath(annonce.id));
      return;
    }
    if (action.confirm) setAsking({ annonce, action });
    else void run(annonce, action);
  };

  const askingBusy = asking ? busy === `${asking.annonce.id}:${asking.action.code}` : false;

  const dialogs = (
    <>
      {/* The confirmation the action itself carries: its title, sentence and button come from the backend. */}
      <Dialog open={asking != null} onOpenChange={(open) => !open && !askingBusy && setAsking(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{asking?.action.confirm?.titre}</DialogTitle>
            {asking?.action.confirm?.texte && <DialogDescription>{asking.action.confirm.texte}</DialogDescription>}
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" disabled={askingBusy} onClick={() => setAsking(null)}>
              {L('Revenir', 'رجوع')}
            </Button>
            <Button
              variant={asking?.action.style === 'danger' ? 'destructive' : 'default'}
              disabled={askingBusy}
              onClick={() => asking && void run(asking.annonce, asking.action)}
            >
              {askingBusy && <Loader2 className="size-4 animate-spin" />}
              {asking?.action.confirm?.bouton ?? asking?.action.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* After « Soumettre »: the backend says what happened — sent to review, or online. */}
      <Dialog open={sent != null} onOpenChange={(open) => !open && setSent(null)}>
        <DialogContent className="text-center sm:max-w-sm">
          <DialogHeader className="items-center">
            <span className="grid size-14 place-items-center rounded-full bg-de9-teal-soft text-[26px]" aria-hidden>
              📣
            </span>
            <DialogTitle className="text-[18px]">{sent?.confirmation.titre}</DialogTitle>
            {sent?.confirmation.texte && <DialogDescription>{sent.confirmation.texte}</DialogDescription>}
          </DialogHeader>
          <Button
            className="w-full"
            onClick={() => {
              const id = sent?.id;
              setSent(null);
              if (id) navigate(detailPath(id));
            }}
          >
            {sent?.confirmation.bouton ?? L('Voir mon annonce', 'عرض إعلاني')}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Drafts are free; submitting needs a verified company. */}
      <Dialog open={kycRequis != null} onOpenChange={(open) => !open && setKycRequis(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{L('Vérification requise', 'التوثيق مطلوب')}</DialogTitle>
            <DialogDescription>{kycRequis}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setKycRequis(null)}>
              {L('Plus tard', 'لاحقًا')}
            </Button>
            <Button onClick={() => navigate('/onboarding/kyc')}>{L('Vérifier mon entreprise', 'وثّق مؤسستي')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return {
    press,
    isBusy: (id: string, code?: string) => (code ? busy === `${id}:${code}` : !!busy?.startsWith(`${id}:`)),
    /** For the forms: show the confirmation of a submission they sent themselves. */
    showSent: (id: string, confirmation: Confirmation) => setSent({ id, confirmation }),
    refus,
    dialogs,
  };
}
