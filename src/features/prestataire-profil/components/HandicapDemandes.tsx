import { BadgeCheck } from 'lucide-react';
import { toProblem, type ApiProblem } from '@/api/problem';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { tonePill } from '@/lib/tones';
import { useLangStore, type Lang } from '@/stores/langStore';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { useMesDemandesHandicap } from '../api/profil';
import type { MaDemandeHandicap } from '../schemas/profil';

/** `statut` → its label and tone, in the app's words. A code this build does not know prints as sent. */
const STATUT: Record<string, { label: [fr: string, ar: string]; ton: string }> = {
  a_contacter: { label: ['Demande envoyée', 'تم إرسال الطلب'], ton: 'attention' },
  contactee: { label: ['de9de9 vous a contacté', 'تواصل معك de9de9'], ton: 'info' },
  en_cours: { label: ['En cours', 'قيد المعالجة'], ton: 'info' },
  pourvue: { label: ['Pourvue', 'مكتمل'], ton: 'valide' },
};

function jour(iso: string | null | undefined, lang: Lang): string | null {
  if (!iso || Number.isNaN(Date.parse(iso))) return null;
  return new Date(iso).toLocaleDateString(lang === 'ar' ? 'ar-DZ' : 'fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Africa/Algiers',
  });
}

/**
 * « Mes demandes » — every handicap request the company sent
 * (`GET /handicap/inscription`), with what de9de9 did with it: called back,
 * and who it placed. Nothing is edited or cancelled from here: a change goes
 * through de9de9.
 */
export function HandicapDemandes() {
  const L = useL();
  const query = useMesDemandesHandicap(true);

  /** Why the list did not load: the API's own French sentence when it gives one. */
  const phrase = (problem: ApiProblem): string => {
    if (problem.code === 'network') return L('Connexion impossible. Réessayez.', 'تعذّر الاتصال. أعد المحاولة.');
    return problem.detail ?? L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.');
  };

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
        description={phrase(toProblem(query.error))}
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
        description={L(
          'Vos demandes et les personnes placées par de9de9 apparaîtront ici.',
          'ستظهر هنا طلباتك والأشخاص الذين يعيّنهم de9de9.',
        )}
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3 px-4 pb-6">
      {query.data.map((demande) => (
        <DemandeCard key={demande.id} demande={demande} />
      ))}
    </ul>
  );
}

function DemandeCard({ demande: d }: { demande: MaDemandeHandicap }) {
  const L = useL();
  const lang = useLangStore((s) => s.lang);
  const statut = STATUT[d.statut];
  const lieu = [d.commune, d.wilaya].filter(Boolean).join(', ');
  const date = jour(d.registeredAt, lang);
  const part = d.positionsCount > 0 ? Math.min(100, Math.round((d.placedCount / d.positionsCount) * 100)) : 0;

  return (
    <li className="flex flex-col gap-3 rounded-lg bg-card p-4 shadow-soft dark:ring-1 dark:ring-border">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {/* What was typed is often French in an Arabic screen: each piece keeps its own direction. */}
          <p className="text-[14px] font-bold break-words text-de9-ink">
            <bdi>{d.jobType}</bdi>
          </p>
          <p className="mt-0.5 text-[12px] text-de9-gray">
            {lieu && <bdi>{lieu}</bdi>}
            {lieu && date && ' · '}
            {date && <bdi>{date}</bdi>}
          </p>
        </div>
        <span className={cn('flex-none rounded-full px-2.5 py-1 text-[11.5px] font-bold', tonePill(statut?.ton))}>
          {statut ? L(...statut.label) : d.statut}
        </span>
      </div>

      <div>
        <p className="text-[12.5px] font-semibold text-de9-slate tabular-nums">
          {L(
            `${d.placedCount} / ${d.positionsCount} ${d.positionsCount > 1 ? 'postes pourvus' : 'poste pourvu'}`,
            `المناصب المشغولة: ${d.placedCount} / ${d.positionsCount}`,
          )}
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
          <div className="h-full rounded-full bg-de9-teal" style={{ width: `${part}%` }} />
        </div>
      </div>

      {d.comment && (
        <p className="text-[12.5px] break-words whitespace-pre-line text-de9-slate">
          <bdi>{d.comment}</bdi>
        </p>
      )}

      {d.personnes.length > 0 && (
        <>
          <ul className="flex flex-col divide-y divide-border border-t border-border">
            {d.personnes.map((p, i) => {
              const depuis = jour(p.placedAt, lang);
              return (
                <li key={`${p.fullName}-${i}`} className="flex items-center gap-2 py-2 text-[13px]">
                  <BadgeCheck className="size-4 flex-none text-de9-blue" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-de9-ink">
                      <bdi>{p.fullName}</bdi>
                    </span>
                    {/* Only a job other than the request's: the card's title already says that one. */}
                    {p.jobType && p.jobType !== d.jobType && (
                      <span className="block truncate text-[12px] text-de9-gray">
                        <bdi>{p.jobType}</bdi>
                      </span>
                    )}
                  </span>
                  {depuis && (
                    <span className="flex-none text-[11.5px] text-de9-gray">
                      {L(`depuis le ${depuis}`, `منذ ${depuis}`)}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {/* No phone on these rows, unlike the pros of « Recruter »: the API gives none. */}
          <p className="text-[11.5px] text-de9-gray">
            {L('de9de9 vous met en relation avec chaque personne.', 'يتولى de9de9 ربطك بكل شخص.')}
          </p>
        </>
      )}
    </li>
  );
}
