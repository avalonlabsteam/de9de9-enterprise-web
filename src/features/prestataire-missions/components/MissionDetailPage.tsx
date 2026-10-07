import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, CalendarDays, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toProblem } from '@/api/problem';
import { proLoadError } from '@/lib/proErrors';
import { toneBox, toneText } from '@/lib/tones';
import type { ApiAction } from '@/lib/actions/schema';
import { useScrollToAnchor } from '@/lib/useScrollToAnchor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { ApiIcon } from '@/components/common/ApiIcon';
import { CategoryBubble } from '@/components/common/CategoryBubble';
import { WorkerAvatar } from '@/components/common/WorkerAvatar';
import { ActionButton, EtapesBar, TonePill } from '@/components/actions/parts';
import { actionKey, useActionPress } from '@/components/actions/useActionPress';
import { calendrierKey } from '@/features/prestataire-calendar/api/calendar';
import { fetchPicker, missionKey, missionsKey, useMission } from '../api/missions';
import { missionReponseSchema, type MissionDetail, type Picker } from '../schemas/missions';
import { missionPath } from '../lib/paths';
import { WorkerPickerDialog } from './WorkerPickerDialog';

/** `/api/v1/equipe/{memberId}/profil` → the member's id. */
const memberIdOf = (href: string | null | undefined) => /\/equipe\/([^/]+)\/profil/.exec(href ?? '')?.[1];

/**
 * « Détail de la mission » — one commande, focused on one occurrence
 * (`GET /prestataire/missions/{id}[?occurrence=]`, guide 12). Every tag, rung
 * and button comes from the answer; one algorithm presses them all.
 */
export function MissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const L = useL();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const occurrence = params.get('occurrence');
  const query = useMission(id, occurrence);
  const d = query.data;
  const detailsRef = useRef<HTMLDivElement>(null);
  const [picker, setPicker] = useState<Picker | null>(null);
  const [pickerLoading, setPickerLoading] = useState<string | null>(null);

  // Another occurrence on screen (a history row, another mission): start from the
  // top of it. Pinning the same focus in the address after an action does not move.
  const shownId = d ? `${d.id}:${d.occurrence?.id ?? ''}` : undefined;
  const lastShown = useRef(shownId);
  useEffect(() => {
    if (shownId === lastShown.current) return;
    lastShown.current = shownId;
    window.scrollTo({ top: 0 });
  }, [shownId]);

  // From an alert: `facture` asks for the invoice block of the focused visit.
  useScrollToAnchor([params.get('facture') ? 'facture' : null], !!d?.facture);

  /** The occurrence on screen — the one every action and every reload is about. */
  const focus = occurrence ?? d?.occurrence?.id ?? null;

  /**
   * Pin the focus in the address: without `?occurrence=` the screen shows the
   * commande's CURRENT occurrence, which an action may just have changed.
   */
  const pinFocus = (occ: string | null | undefined) => {
    if (!occ || occ === occurrence) return;
    setParams(
      (p) => {
        p.set('occurrence', occ);
        return p;
      },
      { replace: true },
    );
  };

  /** The list's tabs and the calendar's events move with the mission. */
  const refreshOthers = () => {
    void queryClient.invalidateQueries({ queryKey: missionsKey });
    void queryClient.invalidateQueries({ queryKey: calendrierKey });
  };

  const reload = () => {
    refreshOthers();
    void queryClient.invalidateQueries({ queryKey: ['prestataire', 'mission', id ?? ''] });
    pinFocus(focus);
  };

  const showScreen = (mission: MissionDetail) => {
    const occ = mission.occurrence?.id ?? focus;
    // The other focuses of this commande are stale too; this one is fresh.
    void queryClient.invalidateQueries({ queryKey: ['prestataire', 'mission', id ?? ''], refetchType: 'none' });
    queryClient.setQueryData(missionKey(id ?? '', occ), mission);
    pinFocus(occ);
    refreshOthers();
  };

  const openPicker = async (action: ApiAction) => {
    if (!action.href) return;
    setPickerLoading(actionKey(action));
    try {
      setPicker(await fetchPicker(action.href));
    } catch (error) {
      const problem = toProblem(error);
      toast.error(problem.detail ?? L("La liste des intervenants n'a pas pu être chargée.", 'تعذّر تحميل قائمة المتدخلين.'));
      // `workers_locked`: the visit is no longer V2 / V3 — the buttons on offer changed.
      if (problem.status === 409 || problem.status === 404) reload();
    } finally {
      setPickerLoading(null);
    }
  };

  const { press, execute, busyKey, dialogs } = useActionPress<MissionDetail>({
    reponse: 'mission',
    readScreen: (data) => {
      const parsed = missionReponseSchema.safeParse(data);
      return parsed.success ? { message: parsed.data.message, screen: parsed.data.mission } : null;
    },
    onScreen: showScreen,
    reload,
    support: d?.support,
    open: (action) => {
      switch (action.ouvre) {
        case 'details_occurrence':
          detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return true;
        case 'intervenants':
          void openPicker(action);
          return true;
        case 'profil_ouvrier': {
          const member = memberIdOf(action.href);
          if (member) navigate(`/prestataire/effectif/${encodeURIComponent(member)}`);
          return true;
        }
      }
      return false;
    },
  });

  const sendPicker = async (workers: Record<string, unknown>[]) => {
    if (!picker) return;
    const result = await execute(picker.envoyer, { ...(picker.envoyer.corps ?? {}), workers });
    const status = toProblem(result.error).status;
    // Done, or the visit moved on (reloaded): close. A refused choice keeps the sheet open.
    if (result.ok || status === 403 || status === 404 || status === 409) setPicker(null);
  };

  const busy = (a: ApiAction) => busyKey === actionKey(a) || pickerLoading === actionKey(a);

  if (query.isPending) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-secondary" />
        <div className="h-36 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-40 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (query.isError || !d) {
    const problem = toProblem(query.error);
    return (
      <div className="mx-auto max-w-3xl py-6">
        <EmptyState
          title={
            problem.status === 404
              ? (problem.detail ?? L('Cette mission est introuvable.', 'هذه المهمة غير موجودة.'))
              : L('Impossible de charger la mission', 'تعذّر تحميل المهمة')
          }
          description={problem.status === 404 ? undefined : proLoadError(problem, L)}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/prestataire/missions')}>
                {L('Missions B2B', 'مهام B2B')}
              </Button>
              {problem.status !== 404 && (
                <Button size="sm" onClick={() => void query.refetch()}>
                  {L('Réessayer', 'إعادة المحاولة')}
                </Button>
              )}
            </div>
          }
        />
      </div>
    );
  }

  const { entete, occurrence: occ, prochaineAction: pa } = d;
  const stale = query.isPlaceholderData;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/prestataire/missions')}
          aria-label={L('Retour', 'رجوع')}
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Button>
        <h1 className="text-xl font-extrabold text-de9-ink">{d.titreEcran ?? L('Détail de la mission', 'تفاصيل المهمة')}</h1>
      </header>

      <div className={cn('flex flex-col gap-4 transition-opacity', stale && 'pointer-events-none opacity-60')}>
        {/* Header — the commande */}
        <Card>
          <CardContent className="flex flex-col gap-4 py-5">
            <div className="flex items-start gap-3.5">
              <CategoryBubble
                icone={entete.icone ?? entete.categorie?.icone}
                famille={entete.categorie?.famille}
                className="size-12 flex-none"
              />
              <div className="min-w-0 flex-1">
                {entete.client && (
                  <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-de9-teal-dark">
                    <Building2 className="size-3.5 flex-none" />
                    <span className="truncate">{entete.client}</span>
                  </p>
                )}
                <p className="text-[17px] font-bold break-words text-de9-ink">{entete.service}</p>
                {entete.occurrenceLigne && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-de9-slate">
                    <CalendarDays className="size-3.5 flex-none text-de9-teal" />
                    {entete.occurrenceLigne}
                  </p>
                )}
                {d.reference && (
                  <p className="mt-0.5 text-[11.5px] text-de9-gray" dir="ltr">
                    {d.reference}
                  </p>
                )}
              </div>
              {entete.etatFacture && <TonePill tag={entete.etatFacture} className="flex-none" />}
            </div>
            {entete.contact && (
              <ActionButton action={entete.contact} busy={busy(entete.contact)} onPress={press} className="h-11 w-full" />
            )}
          </CardContent>
        </Card>

        {/* The focused occurrence and its crew */}
        {occ && (
          <Card>
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  {occ.numeroLabel && <p className="text-[12px] font-bold text-de9-teal-dark">{occ.numeroLabel}</p>}
                  <p className="text-[15px] font-bold text-de9-ink">
                    {occ.jourLabel ?? L('Date à fixer', 'التاريخ سيُحدّد')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {occ.etatVisite && <TonePill tag={occ.etatVisite} />}
                  {occ.etatFacture && <TonePill tag={occ.etatFacture} />}
                </div>
              </div>
              {d.affecteA && d.affecteA.intervenants.length > 0 && <AffecteA mission={d} onPress={press} />}
            </CardContent>
          </Card>
        )}

        {/* Stepper — Confirmée · Réalisée · Facturée · Payé */}
        {d.etapes.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <EtapesBar etapes={d.etapes} grisees={d.etapesGrisees} />
            </CardContent>
          </Card>
        )}

        {/* « PROCHAINE ACTION » */}
        {pa && (
          <div className={cn('flex flex-col gap-2 rounded-2xl px-4 py-4', toneBox(pa.balle?.ton))}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-extrabold tracking-[0.12em] text-de9-slate">
                {L('PROCHAINE ACTION', 'الإجراء التالي')}
              </p>
              {pa.balle && <TonePill tag={pa.balle} />}
            </div>
            <p className="text-[16px] font-bold text-de9-ink">{pa.titre}</p>
            {pa.texte && <p className="text-[13.5px] text-de9-slate">{pa.texte}</p>}
            {pa.motif && (
              <p className={cn('text-[13px] font-semibold', toneText(pa.motif.ton))}>
                {pa.motif.label} : {pa.motif.texte}
              </p>
            )}
          </div>
        )}

        {/* The buttons, in screen order */}
        {d.actions.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {d.actions.map((action) => (
              <ActionButton
                key={`${action.code}-${action.href ?? ''}`}
                action={action}
                busy={busy(action)}
                onPress={press}
                className={cn('h-11 sm:flex-1', action.style === 'lien_danger' && 'sm:flex-none')}
              />
            ))}
          </div>
        )}

        {/* The focused occurrence's invoice — from V5 on */}
        {d.facture && (
          <Card id="facture" className="scroll-mt-24">
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[15px] font-bold text-de9-ink">
                  <ApiIcon code="facture" className="size-4 text-de9-teal" />
                  {L('Facture', 'الفاتورة')}
                </p>
                {d.facture.statut && <TonePill tag={d.facture.statut} />}
              </div>
              <dl className="divide-y divide-border text-[13px]">
                {d.facture.reference && <Row label={L('Référence', 'المرجع')} value={d.facture.reference} ltr />}
                {d.facture.montantLabel && <Row label={L('Montant', 'المبلغ')} value={d.facture.montantLabel} />}
                {d.facture.deposeeLe && <Row label={L('Déposée le', 'أودعت في')} value={d.facture.deposeeLe} />}
                {d.facture.versement && (
                  <Row
                    label={L('Versé', 'تم الدفع')}
                    value={[d.facture.versement.montantLabel, d.facture.versement.dateLabel].filter(Boolean).join(' · ')}
                  />
                )}
                {d.facture.versement?.reference && (
                  <Row label={L('Référence du virement', 'مرجع التحويل')} value={d.facture.versement.reference} ltr />
                )}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* « Détails de l'occurrence » — « Voir le détail » scrolls here */}
        {d.details && (
          <Card ref={detailsRef} className="scroll-mt-24">
            <CardContent className="flex flex-col gap-1 py-4">
              <p className="mb-1 text-[15px] font-bold text-de9-ink">
                {d.details.titre ?? L("Détails de l'occurrence", 'تفاصيل التكرار')}
              </p>
              <ul className="divide-y divide-border">
                {d.details.lignes.map((ligne) => (
                  <li key={ligne.code ?? ligne.label} className="flex items-start gap-3 py-2.5">
                    <span className="grid size-8 flex-none place-items-center rounded-full bg-secondary text-de9-teal">
                      <ApiIcon code={ligne.icone} className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] text-de9-gray">{ligne.label}</p>
                      <p className="text-[13.5px] font-semibold break-words text-de9-ink">{ligne.valeur ?? '—'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* « Autres occurrences à traiter » */}
        {d.autresAVous.length > 0 && (
          <Card>
            <CardContent className="flex flex-col gap-1 py-4">
              <p className="mb-1 text-[15px] font-bold text-de9-ink">
                {L('Autres occurrences à traiter', 'تكرارات أخرى للمعالجة')}
              </p>
              <ul className="divide-y divide-border">
                {d.autresAVous.map((row) => (
                  <OccurrenceRow key={row.occurrenceId} to={missionPath(d.id, row.occurrenceId)} date={row.dateLabel}>
                    <span className="text-[13px] font-bold text-de9-orange-deep">{row.titre}</span>
                  </OccurrenceRow>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* « Historique des occurrences » */}
        {d.historique && d.historique.lignes.length > 0 && (
          <Card>
            <CardContent className="flex flex-col gap-1 py-4">
              <p className="mb-1 text-[15px] font-bold text-de9-ink">
                {d.historique.titre ?? L('Historique des occurrences', 'سجل التكرارات')}
              </p>
              <ul className="divide-y divide-border">
                {d.historique.lignes.map((row) => (
                  <OccurrenceRow key={row.occurrenceId} to={missionPath(d.id, row.occurrenceId)} date={row.dateLabel}>
                    {row.etat && <TonePill tag={row.etat} />}
                  </OccurrenceRow>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {dialogs}
      {picker && (
        <WorkerPickerDialog
          picker={picker}
          busy={busyKey === actionKey(picker.envoyer)}
          onClose={() => setPicker(null)}
          onSend={(workers) => void sendPicker(workers)}
        />
      )}
    </div>
  );
}

function Row({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="text-de9-gray">{label}</dt>
      <dd className="text-end font-semibold text-de9-ink" dir={ltr ? 'ltr' : undefined}>
        {value}
      </dd>
    </div>
  );
}

/** A row refocusing the screen on another occurrence of the same commande. */
function OccurrenceRow({ to, date, children }: { to: string; date?: string | null; children: ReactNode }) {
  const L = useL();
  return (
    <li>
      <Link to={to} className="flex items-center gap-3 py-2.5 hover:bg-secondary/40">
        <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-de9-ink">{date ?? L('Date à fixer', 'التاريخ سيُحدّد')}</span>
        {children}
        <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
      </Link>
    </li>
  );
}

/** « Affecté à » — the crew, ordered by name, each with its stable colour. */
function AffecteA({ mission, onPress }: { mission: MissionDetail; onPress: (a: ApiAction) => void }) {
  const L = useL();
  const crew = mission.affecteA?.intervenants ?? [];
  return (
    <div className="border-t border-border pt-3">
      <p className="mb-2 text-[12px] font-bold text-de9-gray">{mission.affecteA?.titre ?? L('Affecté à', 'مُسند إلى')}</p>
      <ul className="flex flex-col gap-2">
        {crew.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <WorkerAvatar
              worker={{ name: p.nom, initials: p.initiales ?? undefined, colorHex: p.couleur ?? undefined }}
              size={34}
            />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-[13.5px] font-bold text-de9-ink">
                {p.nom}
                {p.typeLabel && (
                  <span className="rounded-full bg-de9-blue-tint px-2 py-0.5 text-[10px] font-bold text-de9-blue">
                    {p.typeLabel}
                  </span>
                )}
              </p>
              {p.role && <p className="truncate text-[12px] text-de9-slate">{p.role}</p>}
            </div>
            {p.profil && (
              <button
                type="button"
                onClick={() => p.profil && onPress(p.profil)}
                className="flex-none text-[12px] font-bold text-de9-teal-dark hover:underline"
              >
                {p.profil.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
