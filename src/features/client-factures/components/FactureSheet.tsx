import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Download, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/api/apiClient';
import { toProblem } from '@/api/problem';
import { downloadAuthedFile, openAuthedFile } from '@/lib/authedFile';
import { actionErrorMessage, apiUrl, buildBody, sendAction, type SheetValues } from '@/lib/actions/run';
import { messageOnlySchema, type ApiAction } from '@/lib/actions/schema';
import { useL } from '@/lib/i18n';
import { hasIcon, toneBox, toneText } from '@/lib/tones';
import { cn } from '@/lib/utils';
import { dirOf, useLangStore } from '@/stores/langStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ApiIcon } from '@/components/common/ApiIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/actions/ActionDialogs';
import { ActionButton, TonePill } from '@/components/actions/parts';
import { demandesQueryKey } from '@/features/client-tenders/api/demandes';
import { suiviQueryKey } from '@/features/client-tenders/api/suivi';
import { portefeuilleKey } from '@/features/client-wallet/api/keys';
import { facturesKey, useFactureEcran } from '../api/useFactures';
import type { FactureEcran, FactureFichier } from '../schemas/facture';

/**
 * One invoice, in a side sheet over the list — `GET /client/factures/{id}`.
 * The API built the screen: the document card, the rows, the contest block,
 * the files and the buttons, each ready to press. Its words are French even on
 * an Arabic screen: each is isolated (`<bdi>`), or « 10 000 DA » would read
 * « DA 000 10 » there.
 */
export function FactureSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const lang = useLangStore((s) => s.lang);
  // Kept while the sheet slides out: it closes on the invoice it showed, not on an empty panel.
  const [shown, setShown] = useState(id);
  if (id && id !== shown) setShown(id);

  return (
    <Sheet open={id !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={dirOf(lang) === 'rtl' ? 'left' : 'right'}
        aria-describedby={undefined}
        className="gap-0 bg-background p-0 outline-none data-[side=left]:w-full data-[side=right]:w-full data-[side=left]:sm:max-w-[440px] data-[side=right]:sm:max-w-[440px]"
      >
        {shown && <Ecran key={shown} id={shown} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}

/** Whether this browser's share sheet takes a file of that kind — where it does not, « Partager » is not offered. */
function peutPartager(partage: NonNullable<FactureEcran['partage']>): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false;
  try {
    const type = partage.contentType ?? 'application/pdf';
    return navigator.canShare({ files: [new File([], partage.nomFichier, { type })] });
  } catch {
    return false;
  }
}

function Ecran({ id, onClose }: { id: string; onClose: () => void }) {
  const L = useL();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const query = useFactureEcran(id);
  const [confirmFor, setConfirmFor] = useState<ApiAction | null>(null);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  /** The invoice file once downloaded for « Partager » (see `partager`). */
  const aPartager = useRef<File | null>(null);

  if (query.isPending) {
    return (
      <>
        <SheetHeader className="pe-12">
          <SheetTitle>{L('Facture', 'فاتورة')}</SheetTitle>
        </SheetHeader>
        <div className="flex animate-pulse flex-col gap-3 px-4">
          <div className="h-28 rounded-lg bg-secondary" />
          <div className="h-32 rounded-lg bg-secondary" />
          <div className="h-14 rounded-lg bg-secondary" />
        </div>
      </>
    );
  }

  if (query.isError) {
    const problem = toProblem(query.error);
    // 404: not this company's, or cancelled since — the API's own sentence.
    const absente = problem.status === 404;
    return (
      <>
        <SheetHeader className="pe-12">
          <SheetTitle>{L('Facture', 'فاتورة')}</SheetTitle>
        </SheetHeader>
        <EmptyState
          title={absente ? L('Cette facture est introuvable', 'هذه الفاتورة غير موجودة') : L('Impossible de charger la facture', 'تعذّر تحميل الفاتورة')}
          description={
            absente
              ? undefined
              : problem.code === 'network'
                ? L('Connexion impossible. Réessayez.', 'تعذّر الاتصال. أعد المحاولة.')
                : (problem.detail ?? L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.'))
          }
          action={
            absente ? (
              <Button variant="outline" size="sm" onClick={onClose}>
                {L('Fermer', 'إغلاق')}
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
                {L('Réessayer', 'إعادة المحاولة')}
              </Button>
            )
          }
        />
      </>
    );
  }

  const e = query.data;
  // `commande.href` is the demande's API path: its last segment is the id « Suivi d'une demande » opens on.
  const demandeId = e.commande?.href?.split('?')[0].split('/').filter(Boolean).at(-1);

  /** The invoice changed, or may have: this screen, the list and its counts, the demande that prints it, the wallet. */
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: facturesKey });
    void queryClient.invalidateQueries({ queryKey: demandesQueryKey });
    if (demandeId) void queryClient.invalidateQueries({ queryKey: suiviQueryKey(demandeId) });
    void queryClient.invalidateQueries({ queryKey: portefeuilleKey });
  };

  /** Send one press; resolves with what refused it, if anything did. */
  const execute = async (action: ApiAction, sheet: SheetValues): Promise<unknown> => {
    setBusyCode(action.code);
    try {
      const data = await sendAction(action, buildBody(action, sheet), sheet.files);
      // « Contestation envoyée » comes with the answer; the approve route (shared, English) sends none.
      const message = messageOnlySchema.safeParse(data);
      if (message.success && message.data.message) {
        toast.success(message.data.message.titre, { description: message.data.message.texte ?? undefined });
      }
      refresh();
      return null;
    } catch (error) {
      const problem = toProblem(error);
      toast.error(actionErrorMessage(action, error, L("L'action n'a pas pu aboutir. Réessayez.", 'تعذّر تنفيذ الإجراء. أعد المحاولة.')));
      // The server answered: the invoice may have moved (approved elsewhere, re-priced, its file replaced) — read it again.
      if (problem.status !== 0) refresh();
      // Not enough credits to approve: the wallet, with its recharge sheet open.
      if (problem.code === 'insufficient_balance') navigate('/client/wallet?recharger=1');
      return error;
    } finally {
      setBusyCode(null);
    }
  };

  const confirmer = async (action: ApiAction, sheet: SheetValues) => {
    const error = await execute(action, sheet);
    if (!error) return setConfirmFor(null);
    const { status } = toProblem(error);
    // A lost connection (the press is retried with the same key), or a field or file the server
    // refused on a sheet that has some: the sheet stays. Anything else, the invoice moved on.
    const aCorriger = (action.confirm?.champs.length ?? 0) > 0 && [400, 413, 415].includes(status);
    if (status !== 0 && !aCorriger) setConfirmFor(null);
  };

  /**
   * « Partager »: the file is private, so it is downloaded with the token and handed to the
   * browser's share sheet. A share must start from a click; when the download outlived it, the
   * file is kept and the next press shares it at once.
   */
  const partager = async () => {
    const p = e.partage;
    if (!p) return;
    setBusyCode('partager');
    try {
      if (!aPartager.current) {
        const res = await apiClient.get(apiUrl(p.fichierHref), { responseType: 'blob', timeout: 60_000 });
        const blob = res.data as Blob;
        aPartager.current = new File([blob], p.nomFichier, { type: p.contentType ?? blob.type });
      }
      await navigator.share({ files: [aPartager.current], title: p.titre ?? undefined, text: p.texte ?? undefined });
    } catch (error) {
      const name = error instanceof DOMException ? error.name : '';
      if (name === 'AbortError') return; // the share sheet was dismissed
      if (name === 'NotAllowedError' && aPartager.current) {
        toast.info(L('Facture prête : appuyez de nouveau sur « Partager ».', 'الفاتورة جاهزة: اضغط مجددًا على « مشاركة ».'));
      } else {
        toast.error(L('Partage impossible.', 'تعذّرت المشاركة.'));
      }
    } finally {
      setBusyCode(null);
    }
  };

  const press = (action: ApiAction) => {
    if (action.ouvre === 'partage') return void partager();
    if (!action.href || !action.method) {
      if (action.indisponible) toast.info(action.indisponible);
      return;
    }
    if (action.confirm) return setConfirmFor(action);
    void execute(action, { values: {}, files: {} });
  };

  // « Télécharger » is on each file's own row here, so the button for the invoice file alone would
  // repeat one of them; « Partager » only where the browser can share a file.
  const boutons = e.actions.filter(
    (a) => a.ouvre !== 'fichier' && (a.ouvre !== 'partage' || (e.partage != null && peutPartager(e.partage))),
  );
  // The émetteur opens the document card: its row would say it twice.
  const lignes = e.lignes.filter((ligne) => ligne.code !== 'emetteur');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SheetHeader className="pe-12">
        <SheetTitle className="break-words">
          <bdi>{e.enTete.titre}</bdi>
        </SheetTitle>
        {e.occurrence && (
          <SheetDescription>
            <bdi>{e.occurrence.label}</bdi>
          </SheetDescription>
        )}
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        {/* The document card */}
        <section className="rounded-lg bg-card p-4 shadow-soft dark:ring-1 dark:ring-border">
          <p className="text-[15px] font-bold break-words text-de9-ink">
            <bdi>{e.document.emetteur}</bdi>
          </p>
          {e.document.sousTitre && (
            <p className="text-[12px] text-de9-gray">
              <bdi>{e.document.sousTitre}</bdi>
            </p>
          )}
          <div className="mt-3 flex items-end justify-between gap-3 border-t border-border pt-3">
            <p className="text-[12.5px] font-semibold text-de9-slate" dir="ltr">
              {e.document.etiquette}
            </p>
            <div className="text-end">
              <p className="text-[11.5px] text-de9-gray">{e.document.montantTitre}</p>
              <p className="text-[20px] leading-tight font-extrabold text-de9-ink tabular-nums">
                <bdi>{e.document.montantLabel}</bdi>
              </p>
            </div>
          </div>
        </section>

        {/* The rows, then the commande the invoice belongs to */}
        <section className="rounded-lg bg-card px-4 shadow-soft dark:ring-1 dark:ring-border">
          <dl className="divide-y divide-border">
            {lignes.map((ligne) => (
              <div key={ligne.code} className="flex items-center justify-between gap-4 py-2.5 text-[13px]">
                <dt className="text-de9-gray">{ligne.label}</dt>
                <dd className={cn('flex items-center gap-1.5 text-end font-semibold', ligne.ton ? toneText(ligne.ton) : 'text-de9-ink')}>
                  {hasIcon(ligne.icone) && <ApiIcon code={ligne.icone} className="size-3.5" />}
                  {ligne.pastille ? <TonePill tag={ligne.pastille} /> : <bdi className="tabular-nums">{ligne.valeur}</bdi>}
                </dd>
              </div>
            ))}
          </dl>
          {e.commande &&
            (demandeId ? (
              <button
                type="button"
                onClick={() => navigate(`/client/tender/${encodeURIComponent(demandeId)}?section=commande`)}
                className="flex w-full items-center justify-between gap-3 border-t border-border py-2.5 text-start text-[13px] font-semibold text-de9-teal-dark hover:underline"
              >
                <bdi>{e.commande.label}</bdi>
                <ChevronRight className="size-4 flex-none rtl:rotate-180" />
              </button>
            ) : (
              <p className="border-t border-border py-2.5 text-[13px] text-de9-gray">
                <bdi>{e.commande.label}</bdi>
              </p>
            ))}
        </section>

        {/* The contest in progress, or de9de9's ruling */}
        {e.contestation && (
          <section className={cn('flex flex-col gap-1.5 rounded-lg px-4 py-3', toneBox(e.contestation.ton))}>
            <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-de9-ink">
              {hasIcon(e.contestation.icone) && <ApiIcon code={e.contestation.icone} className="size-4" />}
              {e.contestation.titre}
            </p>
            {e.contestation.motif && (
              <p className="text-[13px] break-words text-de9-ink">
                <bdi>{e.contestation.motif}</bdi>
              </p>
            )}
            {e.contestation.dateLabel && (
              <p className="text-[12px] text-de9-gray">
                <bdi>{e.contestation.dateLabel}</bdi>
              </p>
            )}
            <p className="text-[12.5px] break-words whitespace-pre-line text-de9-slate">
              <bdi>{e.contestation.texte}</bdi>
            </p>
            {e.contestation.note && (
              <p className="text-[12.5px] font-semibold text-de9-ink">
                <bdi>{e.contestation.note}</bdi>
              </p>
            )}
            {e.contestation.preuves.length > 0 && <Fichiers fichiers={e.contestation.preuves} />}
          </section>
        )}

        {(e.fichiers.length > 0 || e.document.aucunFichier) && (
          <section>
            <h3 className="mb-1 text-[12.5px] font-semibold text-de9-gray">{L('Fichiers', 'الملفات')}</h3>
            {e.fichiers.length > 0 && <Fichiers fichiers={e.fichiers} />}
            {e.document.aucunFichier && (
              <p className="rounded-lg bg-secondary px-3.5 py-3 text-[13px] text-de9-slate">{e.document.aucunFichier}</p>
            )}
          </section>
        )}
      </div>

      {boutons.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t border-border bg-background p-4">
          {boutons.map((action) => (
            <ActionButton
              key={action.code}
              action={action}
              busy={busyCode === action.code}
              onPress={press}
              className="h-11 flex-1"
            />
          ))}
        </div>
      )}

      {confirmFor && (
        <ConfirmDialog
          key={confirmFor.code}
          action={confirmFor}
          busy={busyCode === confirmFor.code}
          onClose={() => setConfirmFor(null)}
          onConfirm={(sheet) => void confirmer(confirmFor, sheet)}
        />
      )}
    </div>
  );
}

/**
 * Files of an invoice: a press on the row opens the preview in a new tab, the
 * arrow saves the file. Both are fetched with the token — never a bare link.
 */
function Fichiers({ fichiers }: { fichiers: FactureFichier[] }) {
  const L = useL();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, task: () => Promise<void>, echec: string) => {
    setBusy(key);
    try {
      await task();
    } catch {
      toast.error(echec);
    } finally {
      setBusy(null);
    }
  };

  return (
    <ul className="divide-y divide-border">
      {fichiers.map((f) => {
        const Icone = f.type === 'image' ? ImageIcon : FileText;
        const ouvre = busy === `${f.id}:apercu`;
        const telecharge = busy === `${f.id}:telecharger`;
        return (
          <li key={f.id} className="flex items-center gap-1">
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                void run(`${f.id}:apercu`, () => openAuthedFile(apiUrl(f.apercuHref)), L("Impossible d'ouvrir le document.", 'تعذّر فتح المستند.'))
              }
              className="flex min-w-0 flex-1 items-center gap-3 py-2.5 text-start"
            >
              <span className="grid size-8 flex-none place-items-center rounded-lg bg-de9-red-soft text-de9-red">
                {ouvre ? <Loader2 className="size-4 animate-spin" /> : <Icone className="size-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-de9-ink">
                  <bdi>{f.nom}</bdi>
                </span>
                <span className="block text-[11.5px] text-de9-gray">
                  <bdi>{[f.roleLabel, f.tailleLabel].filter(Boolean).join(' · ')}</bdi>
                </span>
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={busy !== null}
              aria-label={L(`Télécharger ${f.nom}`, `تنزيل ${f.nom}`)}
              title={L('Télécharger', 'تنزيل')}
              onClick={() =>
                void run(`${f.id}:telecharger`, () => downloadAuthedFile(apiUrl(f.telechargerHref), f.nom), L('Téléchargement impossible.', 'تعذّر التنزيل.'))
              }
            >
              {telecharge ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
