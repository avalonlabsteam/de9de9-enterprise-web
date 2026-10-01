import { useState } from 'react';
import { BadgeCheck, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { toProblem } from '@/api/problem';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { proLoadError } from '@/lib/proErrors';
import { tonePill } from '@/lib/tones';
import { useLangStore } from '@/stores/langStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { useAnnulerDemandePros, useDemandesPros } from '../api/contractuels';
import { demandeOuverte, type DemandePros, type SuiviDemandePros } from '../schemas/contractuels';

/** A demande's status, in the app's tones — the label itself comes from the API. */
const STATUT_TON: Record<string, string> = {
  submitted: 'attention',
  in_progress: 'info',
  fulfilled: 'valide',
  closed: 'neutre',
  cancelled: 'neutre',
};
const STATUT_AR: Record<string, string> = {
  submitted: 'مُرسل',
  in_progress: 'قيد المعالجة',
  fulfilled: 'مكتمل',
  closed: 'مغلق',
  cancelled: 'ملغى',
};
const REASON_MAX = 1000;

/**
 * « Mes demandes » — every demande of pros the company sent
 * (`GET /prestataire/contractuels/demandes`), with how many de9de9 placed and
 * who. A pro placed here is also a contractuel of « Mon effectif ».
 */
export function RecruterDemandes() {
  const L = useL();
  const query = useDemandesPros(true);
  const [annuler, setAnnuler] = useState<DemandePros | null>(null);

  if (query.isPending) {
    return (
      <div className="flex animate-pulse flex-col gap-3 px-4 pb-6">
        {[0, 1].map((i) => (
          <div key={i} className="h-24 rounded-lg bg-secondary" />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <EmptyState
        className="py-8"
        title={L('Impossible de charger vos demandes', 'تعذّر تحميل طلباتك')}
        description={proLoadError(toProblem(query.error), L)}
        action={
          <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
            {L('Réessayer', 'إعادة المحاولة')}
          </Button>
        }
      />
    );
  }

  if (query.data.length === 0) {
    return (
      <EmptyState
        className="py-8"
        title={L('Aucune demande envoyée', 'لم يُرسل أي طلب')}
        description={L('Vos demandes et les pros placés par de9de9 apparaîtront ici.', 'ستظهر هنا طلباتك والمحترفون الذين يعيّنهم de9de9.')}
      />
    );
  }

  return (
    <>
      <ul className="flex flex-col gap-3 px-4 pb-6">
        {query.data.map((suivi) => (
          <DemandeCard key={suivi.demande.id} suivi={suivi} onAnnuler={() => setAnnuler(suivi.demande)} />
        ))}
      </ul>
      {annuler && <AnnulerDialog demande={annuler} onClose={() => setAnnuler(null)} />}
    </>
  );
}

function DemandeCard({ suivi, onAnnuler }: { suivi: SuiviDemandePros; onAnnuler: () => void }) {
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const { demande: d, placements } = suivi;
  const titre = [d.categoryLabel, d.subcategoryLabel].filter(Boolean).join(' · ') || L('Pros de9de9', 'محترفو de9de9');
  const date = d.createdAt
    ? new Date(d.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Algiers',
      })
    : null;
  const part = d.requestedCount > 0 ? Math.min(100, Math.round((d.fulfilledCount / d.requestedCount) * 100)) : 0;
  // Only while nobody is placed: after that the demande is de9de9's to close.
  const annulable = demandeOuverte(d) && d.fulfilledCount === 0 && !placements.some((p) => p.status === 'active');

  return (
    <li className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-soft dark:ring-1 dark:ring-border">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-bold break-words text-de9-ink">{titre}</p>
          <p className="mt-0.5 text-[12px] text-de9-gray">{[d.wilaya, date].filter(Boolean).join(' · ')}</p>
        </div>
        <span className={cn('flex-none rounded-full px-2.5 py-1 text-[11.5px] font-bold', tonePill(STATUT_TON[d.status]))}>
          {L(d.statusLabel ?? d.status, STATUT_AR[d.status] ?? d.statusLabel ?? d.status)}
        </span>
      </div>

      <div>
        <p className="text-[12.5px] font-semibold text-de9-slate tabular-nums">
          {L(`${d.fulfilledCount} / ${d.requestedCount} pros placés`, `${d.fulfilledCount} / ${d.requestedCount} محترف معيَّن`)}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
          <div className="h-full rounded-full bg-de9-teal" style={{ width: `${part}%` }} />
        </div>
      </div>

      {d.note && <p className="text-[12.5px] break-words whitespace-pre-line text-de9-slate">{d.note}</p>}

      {placements.length > 0 && (
        <ul className="flex flex-col divide-y divide-border border-t border-border">
          {placements.map((p, i) => {
            const libere = p.status === 'released';
            return (
              <li key={p.id ?? `${p.displayName}-${i}`} className="flex items-center gap-2 py-2 text-[13px]">
                <BadgeCheck className={cn('size-4 flex-none', libere ? 'text-de9-gray' : 'text-de9-blue')} />
                <span className={cn('min-w-0 flex-1 truncate font-semibold', libere ? 'text-de9-gray' : 'text-de9-ink')}>
                  {p.displayName}
                </span>
                {libere ? (
                  <span className="flex-none text-[11.5px] text-de9-gray">{L('Libéré', 'تم تسريحه')}</span>
                ) : (
                  p.phone && (
                    <a href={`tel:${p.phone}`} dir="ltr" className="flex flex-none items-center gap-1 text-[12.5px] font-semibold text-de9-teal-dark hover:underline">
                      <Phone className="size-3.5" />
                      {p.phone}
                    </a>
                  )
                )}
              </li>
            );
          })}
        </ul>
      )}

      {annulable && (
        <button type="button" onClick={onAnnuler} className="self-start text-[12.5px] font-semibold text-destructive underline-offset-4 hover:underline">
          {L('Annuler la demande', 'إلغاء الطلب')}
        </button>
      )}
    </li>
  );
}

/** « Annuler la demande » after a confirmation; the reason is the company's to give or not. */
function AnnulerDialog({ demande, onClose }: { demande: DemandePros; onClose: () => void }) {
  const L = useL();
  const annuler = useAnnulerDemandePros();
  const [reason, setReason] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const confirm = () => {
    setErreur(null);
    annuler.mutate(
      { id: demande.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(L('Demande annulée', 'تم إلغاء الطلب'));
          onClose();
        },
        onError: (error) => {
          const problem = toProblem(error);
          const message = problem.detail ?? L("La demande n'a pas pu être annulée. Réessayez.", 'تعذّر إلغاء الطلب. أعد المحاولة.');
          // A reason the API wants or refuses stays in the dialog; anything else means the
          // demande moved meanwhile (a pro was placed, it was closed): the list says so.
          if (problem.status === 400) setErreur(message);
          else {
            toast.error(message);
            onClose();
          }
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !annuler.isPending && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{L('Annuler cette demande ?', 'إلغاء هذا الطلب؟')}</DialogTitle>
          <DialogDescription>
            {L('de9de9 arrêtera de chercher des pros pour cette demande.', 'سيتوقف de9de9 عن البحث عن محترفين لهذا الطلب.')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label className="text-[12.5px] text-de9-gray">{L('Motif (facultatif)', 'السبب (اختياري)')}</Label>
          <Textarea value={reason} maxLength={REASON_MAX} rows={3} onChange={(e) => setReason(e.target.value)} />
          {erreur && <span className="text-[11.5px] text-de9-red">{erreur}</span>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={annuler.isPending}>
            {L('Revenir', 'رجوع')}
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={annuler.isPending}>
            {annuler.isPending && <Loader2 className="size-4 animate-spin" />}
            {L('Annuler la demande', 'إلغاء الطلب')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
