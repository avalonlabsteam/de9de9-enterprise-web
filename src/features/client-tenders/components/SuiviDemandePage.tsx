import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toProblem } from '@/api/problem';
import { useScrollToAnchor } from '@/lib/useScrollToAnchor';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import { CategorieVisual } from '@/features/client-catalogue/components/CategorieVisual';
import { suiviQueryKey, useDemandeSuivi } from '../api/suivi';
import { demandesQueryKey } from '../api/demandes';
import { portefeuilleKey } from '@/features/client-wallet/api/portefeuille';
import { actionErrorMessage, buildBody, sendAction, type SheetValues } from '@/lib/actions/run';
import { toneBox, tonePill } from '@/lib/tones';
import { actionReponseSchema, messageOnlySchema, type SuiviAction } from '../schemas/suivi';
import { ActionButton, EtapesBar, TonePill } from '@/components/actions/parts';
import { PrestataireIdentity } from './suivi/parts';
import { BriefDialog } from './suivi/BriefDialog';
import { CommandeSection } from './suivi/CommandeSection';
import { ConfirmDialog, SupportDialog, ViewerDialog } from '@/components/actions/ActionDialogs';
import { DevisBlock } from './suivi/DevisBlock';

const keyOf = (a: SuiviAction) => `${a.method}:${a.href}`;

/**
 * « Suivi d'une demande » — `GET /client/demandes/{id}`, from « En attente » to
 * the last invoice of its commande. The app draws what the answer says and
 * handles every button with one algorithm (guide §4), never a per-code rule.
 */
export function SuiviDemandePage() {
  const { id } = useParams<{ id: string }>();
  const L = useL();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useDemandeSuivi(id);
  // From an alert: `section=devis|commande` scrolls to that block, `occurrence` to that visit.
  const [params] = useSearchParams();
  const section = params.get('section');
  const occurrence = params.get('occurrence');
  useScrollToAnchor(
    [occurrence && `occurrence-${occurrence}`, section === 'devis' || section === 'commande' ? `section-${section}` : null],
    !!query.data,
  );

  const [confirmFor, setConfirmFor] = useState<SuiviAction | null>(null);
  const [viewer, setViewer] = useState<SuiviAction | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [briefFor, setBriefFor] = useState<SuiviAction | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const reload = () => {
    void query.refetch();
    void queryClient.invalidateQueries({ queryKey: demandesQueryKey });
  };

  // An approval or a contest moves credits: the wallet reloads when next shown.
  const walletMayHaveChanged = () => void queryClient.invalidateQueries({ queryKey: portefeuilleKey });

  /** Steps 3–8: send, then read the answer by `reponse`. Resolves with the outcome. */
  const execute = async (
    action: SuiviAction,
    body: Record<string, unknown>,
    files: Record<string, File | File[]> = {},
    /** The caller shows the error itself (the edit form, inline). */
    quiet = false,
  ): Promise<{ ok: boolean; error?: unknown }> => {
    setBusyKey(keyOf(action));
    try {
      const data = await sendAction(action, body, files);
      if (action.reponse === 'demande') {
        const parsed = actionReponseSchema.safeParse(data);
        if (parsed.success) {
          queryClient.setQueryData(suiviQueryKey(id ?? ''), parsed.data.demande);
          const message = parsed.data.message;
          if (message) toast.success(message.titre, { description: message.texte ?? undefined });
          void queryClient.invalidateQueries({ queryKey: demandesQueryKey });
        } else {
          reload();
        }
      } else {
        // `recharger`: the reused routes answer their own format — a message
        // may still come (« Contestation envoyée »), then the screen is fetched again.
        const message = messageOnlySchema.safeParse(data);
        if (message.success && message.data.message) {
          toast.success(message.data.message.titre, { description: message.data.message.texte ?? undefined });
        }
        reload();
      }
      walletMayHaveChanged();
      return { ok: true };
    } catch (error) {
      if (!quiet) {
        toast.error(actionErrorMessage(action, error, L("L'action n'a pas pu aboutir. Réessayez.", 'تعذّر تنفيذ الإجراء. أعد المحاولة.')));
      }
      // The screen is out of date: fetch it before the client acts again.
      if (toProblem(error).status === 409) reload();
      // Not enough credits to approve: the wallet, with its recharge sheet open.
      if (toProblem(error).code === 'insufficient_balance') navigate('/client/wallet?recharger=1');
      return { ok: false, error };
    } finally {
      setBusyKey(null);
    }
  };

  /** Steps 1–2: what a press opens, asks, or sends. */
  const press = (action: SuiviAction) => {
    if (!action.ouvre && !action.href) {
      if (action.indisponible) toast.info(action.indisponible);
      return;
    }
    switch (action.ouvre) {
      case 'formulaire_modifier':
        setBriefFor(action);
        return;
      case 'support':
        setSupportOpen(true);
        return;
      case 'document':
        setViewer(action);
        return;
      case 'factures':
        navigate('/client/factures');
        return;
    }
    if (action.confirm) {
      setConfirmFor(action);
      return;
    }
    void execute(action, buildBody(action, { values: {}, files: {} }));
  };

  const confirmSheet = async (action: SuiviAction, sheet: SheetValues) => {
    const result = await execute(action, buildBody(action, sheet), sheet.files);
    // Keep the sheet open on a lost connection so the press can be retried
    // (with the same idempotency key); close it once the server answered.
    if (result.ok || toProblem(result.error).status !== 0) setConfirmFor(null);
  };

  if (query.isPending) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-secondary" />
        <div className="h-32 animate-pulse rounded-2xl bg-secondary" />
        <div className="h-24 animate-pulse rounded-2xl bg-secondary" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    const problem = toProblem(query.error);
    return (
      <div className="mx-auto max-w-3xl py-6">
        <EmptyState
          title={
            problem.status === 404
              ? L('Cette demande est introuvable', 'هذا الطلب غير موجود')
              : L('Impossible de charger la demande', 'تعذّر تحميل الطلب')
          }
          description={problem.status === 404 ? undefined : (problem.detail ?? L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.'))}
          action={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/client/tenders')}>
                {L('Mes demandes', 'طلباتي')}
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

  const d = query.data;
  const { entete } = d;
  const pa = d.prochaineAction;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => navigate('/client/tenders')} aria-label={L('Retour', 'رجوع')}>
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </Button>
        <h1 className="text-xl font-extrabold text-de9-ink">{d.titreEcran ?? L("Appel d'offres", 'طلب عروض')}</h1>
      </header>

      {/* Header — the same facts as the « Mes demandes » card */}
      <Card className={cn(entete.annulee && 'opacity-70')}>
        <CardContent className="flex items-start gap-3.5 py-5">
          <span
            aria-hidden
            className="grid size-12 flex-none place-items-center rounded-full bg-secondary"
            style={entete.categorie?.couleur ? { backgroundColor: `${entete.categorie.couleur}22` } : undefined}
          >
            <CategorieVisual icone={entete.categorie?.icone} iconClassName="size-9" emojiClassName="text-[22px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[17px] font-bold text-de9-ink">
              <span className="min-w-0 break-words">{entete.titre}</span>
              {entete.recurrent && (
                <RefreshCw className="size-4 flex-none text-de9-teal" aria-label={entete.frequenceLabel ?? L('Récurrente', 'متكررة')} />
              )}
            </p>
            {entete.categorie?.label && <p className="text-[12.5px] text-de9-gray">{entete.categorie.label}</p>}
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[12.5px] text-de9-slate">
              {entete.wilaya && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 text-de9-teal" />
                  {entete.wilaya}
                </span>
              )}
              {entete.wilaya && entete.dateLabel && <span aria-hidden>·</span>}
              {entete.dateLabel && <span>{entete.dateLabel}</span>}
            </p>
            {entete.commandeReference && (
              <p className="mt-0.5 text-[12px] text-de9-gray" dir="ltr">
                {entete.commandeReference}
              </p>
            )}
          </div>
          <span className={cn('flex-none rounded-full px-2.5 py-1 text-[11px] font-bold', tonePill(entete.statut.ton))}>
            {entete.statut.label}
          </span>
        </CardContent>
      </Card>

      {/* Stepper — three rungs before the contract */}
      {d.stepper && d.stepper.etapes.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <EtapesBar etapes={d.stepper.etapes} />
          </CardContent>
        </Card>
      )}

      {/* « ✓ Prestataire assigné » — once contracted */}
      {d.prestataire && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-de9-teal-dark">
              <BadgeCheck className="size-4" />
              {d.prestataire.titre ?? L('Prestataire assigné', 'تم تعيين مقدّم الخدمة')}
            </p>
            <PrestataireIdentity p={d.prestataire} />
          </CardContent>
        </Card>
      )}

      {/* « PROCHAINE ACTION » */}
      {pa && (
        <div className={cn('flex flex-col gap-3 rounded-2xl border-s-4 px-4 py-4', toneBox(pa.ton))}>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-extrabold tracking-[0.12em] text-de9-slate">
              {L('PROCHAINE ACTION', 'الإجراء التالي')}
            </p>
            {pa.balle && <TonePill tag={pa.balle} />}
          </div>
          <div>
            <p className="text-[16px] font-bold text-de9-ink">{pa.titre}</p>
            {pa.texte && <p className="mt-0.5 text-[13.5px] text-de9-slate">{pa.texte}</p>}
          </div>
          {pa.etapes && pa.etapes.length > 0 && <EtapesBar etapes={pa.etapes} />}
        </div>
      )}

      {/* The devis to choose from — « Assigné » only */}
      {d.devis && (
        <div id="section-devis" className="scroll-mt-24">
          <DevisBlock devis={d.devis} busyKey={busyKey} onPress={press} />
        </div>
      )}

      {/* Visits, invoices, review — once contracted */}
      {d.commande && (
        <div id="section-commande" className="scroll-mt-24">
          <CommandeSection
            commande={d.commande}
            highlightId={occurrence ?? pa?.occurrenceId}
            busyKey={busyKey}
            onPress={press}
          />
        </div>
      )}

      {/* The buttons at the bottom, in screen order */}
      {d.actions.length > 0 && (
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {d.actions.map((action) => (
            <ActionButton
              key={`${action.code}-${action.href ?? ''}`}
              action={action}
              busy={busyKey === keyOf(action)}
              onPress={press}
              className={cn('h-11 sm:flex-1', action.style === 'lien_danger' && 'sm:flex-none')}
            />
          ))}
        </div>
      )}

      {confirmFor && (
        <ConfirmDialog
          key={keyOf(confirmFor)}
          action={confirmFor}
          busy={busyKey === keyOf(confirmFor)}
          onClose={() => setConfirmFor(null)}
          onConfirm={(sheet) => void confirmSheet(confirmFor, sheet)}
        />
      )}
      {supportOpen && d.support && <SupportDialog support={d.support} onClose={() => setSupportOpen(false)} />}
      {viewer && <ViewerDialog action={viewer} onClose={() => setViewer(null)} />}
      {briefFor && d.brief && (
        <BriefDialog
          brief={d.brief}
          action={briefFor}
          busy={busyKey === keyOf(briefFor)}
          onClose={() => setBriefFor(null)}
          save={async (body, files) => {
            const result = await execute(briefFor, body, files.length > 0 ? { files } : {}, true);
            // Saved, or the demande moved on (409, reloaded): the form is done —
            // a 409 is then said in a toast, since the form that would show it closes.
            if (!result.ok && toProblem(result.error).status === 409) {
              toast.error(actionErrorMessage(briefFor, result.error, L('La demande a changé. Rechargée.', 'تغيّر الطلب. أُعيد تحميله.')));
            }
            if (result.ok || toProblem(result.error).status === 409) setBriefFor(null);
            return result;
          }}
        />
      )}
    </div>
  );
}
