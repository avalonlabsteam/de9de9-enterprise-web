import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Check, MapPin, Plus, ShieldCheck, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useT, useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { uiActions } from '@/stores/uiStore';
import {
  computeDemandBadge,
  projectionLabel,
  type SetupCode,
  type VisiteCode,
} from '@/lib/statusModel';
import { FAMILY_BY_ID } from '@/lib/catalogue';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CategoryChip, CategoryIcon } from '@/components/common/CategoryChip';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Stepper } from '@/components/common/Stepper';
import { EmptyState } from '@/components/common/EmptyState';
import { DocViewer, type DocViewerDoc } from '@/components/common/DocViewer';
import { useTender, useTenderAction, useReview } from '../api/tenders';
import type { OccurrenceT, ProposalT, Tender } from '../schemas/tender';
import { fmtDate, fmtDzd, fmtCredits } from '../lib/format';
import { ApproveModal } from './modals/ApproveModal';
import { ContestSheet } from './modals/ContestSheet';
import { AddRecurrenceSheet } from './modals/AddRecurrenceSheet';
import { CancelDemandModal } from './modals/CancelDemandModal';
import { ReviewSheet } from './modals/ReviewSheet';

type Phase = 'attente' | 'devis' | 'assigne' | 'encours' | 'confirme' | 'termine' | 'annule';

function phaseOf(t: Tender): Phase {
  const occ = t.occurrences;
  if (occ.length > 0 && occ.every((o) => o.status === 'cancelled')) return 'annule';
  if (t.setup === 'arappeler' || t.setup === 'contacte') return 'attente';
  if (t.setup === 'devis') return 'devis';
  if (t.setup === 'assigne') return 'assigne';
  if (occ.every((o) => o.status === 'paid' || o.status === 'cancelled')) return 'termine';
  const pending = occ.some((o) => o.status === 'toConfirm' || o.status === 'doneInvoiced');
  const confirmedOnly = occ.some((o) => o.status === 'confirmed' || o.status === 'confirmedAssigned');
  if (!pending && confirmedOnly) return 'confirme';
  return 'encours';
}

/**
 * The earliest occurrence still needing a CLIENT action. Skips terminal states
 * (paid/cancelled) AND client-terminal `doneApproved` — once the client has
 * approved a facture, that occurrence is done from their side (only the de9de9
 * settlement to `paid` follows), so it must not mask a later actionable visit.
 */
function currentOcc(t: Tender): OccurrenceT | undefined {
  return t.occurrences.find(
    (o) => o.status !== 'paid' && o.status !== 'cancelled' && o.status !== 'doneApproved',
  );
}

const SETUP_STEPS: { codes: SetupCode[]; label: string }[] = [
  { codes: ['arappeler', 'contacte'], label: 'En attente' },
  { codes: ['devis'], label: 'Devis en cours' },
  { codes: ['assigne'], label: 'Assigné' },
];

function setupReached(setup: SetupCode): number {
  return SETUP_STEPS.findIndex((s) => s.codes.includes(setup));
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-[13px] font-extrabold tracking-wide text-de9-slate uppercase">{children}</h2>;
}

export function TenderDetailPage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const { id = '' } = useParams();
  const { data: tender, isPending, isError } = useTender(id);
  const action = useTenderAction(id);
  const review = useReview(id);

  const [doc, setDoc] = useState<DocViewerDoc | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [contestOpen, setContestOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [recur, setRecur] = useState<{ open: boolean; mode: 'add' | 'reschedule' }>({
    open: false,
    mode: 'add',
  });
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-4 h-8 w-40 animate-pulse rounded bg-secondary" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-3 h-28 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
    );
  }

  if (isError || !tender) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <EmptyState
          title={L('Demande introuvable', 'الطلب غير موجود')}
          description={L('Cette demande n’existe pas ou a été supprimée.', 'هذا الطلب غير موجود أو تم حذفه.')}
          action={
            <Button variant="outline" onClick={() => navigate('/client/tenders')}>
              {t('suiviTitle')}
            </Button>
          }
        />
      </div>
    );
  }

  const fam = FAMILY_BY_ID[tender.familyId];
  const badge = computeDemandBadge({ setup: tender.setup, occurrences: tender.occurrences, type: tender.type });
  const phase = phaseOf(tender);
  const cur = currentOcc(tender);
  const setupActive = tender.setup !== null;
  const isEarly = tender.setup === 'arappeler' || tender.setup === 'contacte' || tender.setup === 'devis';
  const hasPaid = tender.occurrences.some((o) => o.status === 'paid');
  const allTerminal =
    tender.occurrences.length > 0 &&
    tender.occurrences.every((o) => o.status === 'paid' || o.status === 'cancelled');

  const nextActionLabel: Record<Phase, string> = {
    attente: L('Demande reçue', 'تم استلام الطلب'),
    devis: L('Devis en cours', 'العروض قيد الإعداد'),
    assigne: L('Propositions reçues', 'وصلت العروض'),
    encours: L('Prestation en cours', 'الخدمة جارية'),
    confirme: L('Prestation confirmée', 'تم تأكيد الخدمة'),
    termine: L('Prestation terminée', 'انتهت الخدمة'),
    annule: L('Demande annulée', 'تم إلغاء الطلب'),
  };

  const run = (input: Parameters<typeof action.mutate>[0], okMsg: string) => {
    action.mutate(input, {
      onSuccess: () => toast.success(okMsg),
      onError: () => toast.error(L('Action échouée', 'فشل الإجراء')),
    });
  };

  const openFacture = (o: OccurrenceT) => {
    const status: DocViewerDoc['status'] =
      o.status === 'doneInvoiced' ? 'waiting' : o.status === 'doneDisputed' ? 'contested' : 'approved';
    setDoc({
      montant: o.montant != null ? fmtDzd(o.montant) : undefined,
      emetteur: tender.prov?.alias ?? 'de9de9',
      date: fmtDate(o.date),
      creditsDeduits: o.montant != null ? fmtCredits(o.montant) : undefined,
      statut: projectionLabel(o.status, 'client', o.date),
      status,
    });
  };

  const openDevis = (p: ProposalT) => {
    setDoc({
      montant: fmtDzd(p.montantDzd),
      emetteur: p.alias,
      statut: `${L('Délai proposé', 'الأجل المقترح')} : ${p.delai} · ★ ${p.note}/5`,
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5 flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate('/client/tenders')} aria-label="Retour">
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-lg font-extrabold text-de9-ink">{tender.id}</h1>
      </header>

      {/* Header card */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <div className="flex items-start gap-3.5">
            {fam && <CategoryIcon colorKey={fam.colorKey} icon={fam.icon} />}
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-extrabold text-de9-ink">{tender.serviceName}</p>
              {fam && (
                <div className="mt-1.5">
                  <CategoryChip colorKey={fam.colorKey} label={fam.name.fr} />
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-de9-gray">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {tender.wilaya}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3.5" />
                  {fmtDate(tender.createdAt)}
                </span>
                {tender.recurrence && <span>{tender.recurrence}</span>}
              </div>
            </div>
          </div>
          {tender.description && (
            <p className="mt-3 text-[13px] leading-relaxed text-de9-slate">{tender.description}</p>
          )}
          <div className="mt-3">
            <StatusBadge label={badge.fr} kind={badge.kind} />
          </div>
        </CardContent>
      </Card>

      {/* Setup timeline */}
      {setupActive && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <SectionTitle>{L('Préparation', 'التحضير')}</SectionTitle>
            <div className="flex items-center">
              {SETUP_STEPS.map((step, i) => {
                const reached = setupReached(tender.setup as SetupCode);
                const done = i < reached;
                const current = i === reached;
                return (
                  <div key={step.label} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center gap-1.5">
                      <div
                        className={cn(
                          'flex size-7 items-center justify-center rounded-full border-2 text-[11px] font-extrabold',
                          done && 'border-de9-teal-dark bg-de9-teal-dark text-white',
                          current && 'border-de9-teal-dark bg-[#E5F7F4] text-de9-teal-dark dark:bg-[#14322E]',
                          !done && !current && 'border-de9-line bg-card text-de9-gray',
                        )}
                      >
                        {done ? <Check className="size-3.5" /> : i + 1}
                      </div>
                      <span
                        className={cn(
                          'text-[11px] font-bold whitespace-nowrap',
                          done || current ? 'text-de9-slate' : 'text-de9-gray',
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < SETUP_STEPS.length - 1 && (
                      <div
                        className={cn(
                          'mx-1.5 h-0.5 flex-1 rounded-full',
                          i < setupReached(tender.setup as SetupCode) ? 'bg-de9-teal-dark' : 'bg-de9-line',
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider (blind-masked) */}
      {tender.prov && (
        <Card className="mb-4">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#E5F7F4] text-de9-teal-dark dark:bg-[#14322E]">
              <ShieldCheck className="size-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold text-de9-ink">{tender.prov.alias}</p>
              <div className="mt-0.5 flex items-center gap-3 text-[12px] text-de9-gray">
                <span className="inline-flex items-center gap-1">
                  <Star className="size-3.5 fill-[#E0A82E] text-[#E0A82E]" />
                  {tender.prov.note}/5
                </span>
                <span>
                  {tender.prov.missions} {L('missions', 'مهمة')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prochaine action */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <SectionTitle>{t('nextAction')}</SectionTitle>
          <p className="text-[14px] font-bold text-de9-ink">{nextActionLabel[phase]}</p>
        </CardContent>
      </Card>

      {/* Proposals — provider selection (S4/assigne) */}
      {tender.setup === 'assigne' && tender.proposals && tender.proposals.length > 0 && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <SectionTitle>{L('Propositions', 'العروض')}</SectionTitle>
            <div className="flex flex-col gap-2.5">
              {tender.proposals.map((p) => (
                <div
                  key={p.id}
                  role="radio"
                  aria-checked={selectedProposal === p.id}
                  tabIndex={0}
                  onClick={() => setSelectedProposal(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedProposal(p.id);
                    }
                  }}
                  className={cn(
                    'cursor-pointer rounded-xl border p-3 text-start transition-colors',
                    selectedProposal === p.id
                      ? 'border-de9-teal-dark bg-[#E5F7F4] dark:bg-[#14322E]'
                      : 'border-de9-line bg-card hover:border-de9-teal',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-bold text-de9-ink">{p.alias}</span>
                    <span className="inline-flex items-center gap-1 text-[12px] text-de9-gray">
                      <Star className="size-3.5 fill-[#E0A82E] text-[#E0A82E]" />
                      {p.note}/5
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-de9-slate">
                    <span>
                      <span className="text-de9-gray">{L('Montant du devis', 'مبلغ العرض')} :</span>{' '}
                      <span className="font-bold text-de9-ink">{fmtDzd(p.montantDzd)}</span>
                    </span>
                    <span>
                      <span className="text-de9-gray">{L('Délai proposé', 'الأجل المقترح')} :</span> {p.delai}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDevis(p);
                    }}
                    className="mt-2 inline-block text-[12px] font-bold text-de9-teal-dark underline underline-offset-2"
                  >
                    {t('voirDevis')}
                  </button>
                </div>
              ))}
            </div>
            <Button
              className="mt-4 w-full bg-de9-teal-dark text-white hover:bg-de9-teal-dark/90"
              disabled={!selectedProposal || action.isPending}
              onClick={() => run({ action: 'chooseProvider' }, L('Prestataire confirmé', 'تم تأكيد مقدّم الخدمة'))}
            >
              {t('confirmProvider')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Occurrences */}
      {tender.occurrences.length > 0 && (
        <Card className="mb-4">
          <CardContent className="py-4">
            <SectionTitle>{tender.type === 'recurrent' ? L('Récurrence', 'التكرار') : L('Prestation', 'الخدمة')}</SectionTitle>

            {cur && (
              <>
                <Stepper status={cur.status} className="mb-4" />

                {/* Current occurrence controls */}
                {cur.status === 'toConfirm' && (
                  <div className="rounded-xl border border-de9-line bg-de9-row p-3">
                    <p className="mb-2 text-[13px] font-bold text-de9-ink">
                      {cur.label ?? L('Prochaine visite', 'الزيارة القادمة')} · {fmtDate(cur.date)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="bg-de9-teal-dark text-white hover:bg-de9-teal-dark/90"
                        disabled={action.isPending}
                        onClick={() =>
                          run({ action: 'confirmOcc', occId: cur.id }, L('Visite confirmée', 'تم تأكيد الزيارة'))
                        }
                      >
                        {t('occConfirmer')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRecur({ open: true, mode: 'reschedule' })}>
                        {t('occReprog')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={action.isPending}
                        onClick={() =>
                          run({ action: 'cancelOcc', occId: cur.id }, L('Occurrence annulée', 'تم إلغاء الموعد'))
                        }
                      >
                        {t('occAnnuler')}
                      </Button>
                    </div>
                  </div>
                )}

                {(cur.status === 'confirmed' || cur.status === 'confirmedAssigned') && (
                  <p className="rounded-xl border border-de9-line bg-de9-row p-3 text-[13px] text-de9-slate">
                    {L('Prochaine visite', 'الزيارة القادمة')} : {fmtDate(cur.date)}
                  </p>
                )}

                {cur.status === 'doneNoInvoice' && (
                  <p className="rounded-xl border border-de9-line bg-de9-row p-3 text-[13px] text-de9-slate">
                    {L('En attente de la facture', 'في انتظار الفاتورة')}
                  </p>
                )}

                {(cur.status === 'doneInvoiced' || cur.status === 'doneDisputed') && (
                  <div className="rounded-xl border border-de9-line bg-de9-row p-3">
                    <p className="mb-2 text-[13px] font-bold text-de9-ink">
                      {cur.label ?? L('Facture', 'الفاتورة')}
                      {cur.montant != null && <> · {fmtDzd(cur.montant)}</>}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => openFacture(cur)}>
                        {t('facVoir')}
                      </Button>
                      {cur.status === 'doneInvoiced' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-de9-teal-dark text-white hover:bg-de9-teal-dark/90"
                            onClick={() => setApproveOpen(true)}
                          >
                            {t('facApprouver')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-de9-red text-de9-red hover:bg-de9-red/10"
                            onClick={() => setContestOpen(true)}
                          >
                            {t('facContester')}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Occurrence history */}
            <Separator className="my-4" />
            <div className="flex flex-col gap-2">
              {tender.occurrences.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 py-1">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-bold text-de9-ink">
                      {o.label ?? L('Occurrence', 'موعد')}
                    </p>
                    <p className="text-[12px] text-de9-gray">{fmtDate(o.date)}</p>
                  </div>
                  <StatusBadge
                    label={projectionLabel(o.status, 'client', o.date)}
                    kind={statusKind(o.status)}
                    className="flex-none"
                  />
                </div>
              ))}
            </div>

            {/* Recurrence + review actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {tender.type === 'recurrent' && !allTerminal && (
                <Button size="sm" variant="outline" onClick={() => setRecur({ open: true, mode: 'add' })}>
                  <Plus className="size-4" />
                  {t('addRecur')}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>
                {t('laisserAvis')}
              </Button>
              {(hasPaid || phase === 'termine') && (
                <Button size="sm" variant="ghost" onClick={() => navigate('/client/factures')}>
                  {t('voirFactures')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Early actions */}
      {isEarly && (
        <Card className="mb-4">
          <CardContent className="flex flex-col gap-2 py-4">
            <Button variant="outline" onClick={() => navigate(`/client/publish/${tender.familyId}`)}>
              {t('actModifier')}
            </Button>
            <Button variant="outline" onClick={() => uiActions.openSupport()}>
              {t('actContactSupport')}
            </Button>
            <Button
              variant="outline"
              className="border-de9-red text-de9-red hover:bg-de9-red/10"
              onClick={() => setCancelOpen(true)}
            >
              {t('actAnnuler')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Overlays */}
      <DocViewer open={doc !== null} onOpenChange={(o) => !o && setDoc(null)} doc={doc ?? {}} />
      <ApproveModal
        open={approveOpen}
        onOpenChange={setApproveOpen}
        onConfirm={() =>
          run({ action: 'approveOcc', occId: cur?.id }, L('Facture approuvée', 'تمت الموافقة على الفاتورة'))
        }
      />
      <ContestSheet
        open={contestOpen}
        onOpenChange={setContestOpen}
        onConfirm={({ motif }) =>
          run({ action: 'contestOcc', occId: cur?.id, motif }, L('Contestation envoyée', 'تم إرسال الاعتراض'))
        }
      />
      <AddRecurrenceSheet
        open={recur.open}
        mode={recur.mode}
        onOpenChange={(o) => setRecur((r) => ({ ...r, open: o }))}
        onConfirm={(date) =>
          recur.mode === 'add'
            ? run({ action: 'addOcc', date }, L('Récurrence ajoutée', 'تمت إضافة التكرار'))
            : run({ action: 'rescheduleOcc', occId: cur?.id, date }, L('Occurrence reprogrammée', 'تمت إعادة الجدولة'))
        }
      />
      <CancelDemandModal
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={() => run({ action: 'cancelDemand' }, L('Demande annulée', 'تم إلغاء الطلب'))}
      />
      <ReviewSheet
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        onConfirm={(input) =>
          review.mutate(input, {
            onSuccess: () => toast.success(L('Avis envoyé', 'تم إرسال التقييم')),
            onError: () => toast.error(L('Action échouée', 'فشل الإجراء')),
          })
        }
      />
    </div>
  );
}

/** Per-occurrence badge tint from its own visite status. */
function statusKind(code: VisiteCode): 'action' | 'wait' | 'done' | 'info' | 'cancelled' {
  if (code === 'cancelled') return 'cancelled';
  if (code === 'paid' || code === 'doneApproved') return 'done';
  if (code === 'toConfirm' || code === 'doneInvoiced') return 'action';
  if (code === 'doneNoInvoice' || code === 'doneDisputed') return 'wait';
  return 'info';
}
