import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, ChevronRight, Clock, Download, Info, Loader2, Mail, Phone, Printer, TriangleAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toProblem, toProblemOfBlob } from '@/api/problem';
import { apiUrl } from '@/api/hostUrl';
import { openAuthedFile } from '@/lib/authedFile';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/common/EmptyState';
import {
  apresCredit,
  envoyerRecu,
  forgetPaiement,
  POLL_FOR_MS,
  recuBanqueUrl,
  rememberPaiement,
  telechargerRecu,
  usePaiement,
} from '../api/paiements';
import type { Paiement } from '../schemas/paiements';

const WALLET = '/client/wallet';
/** « Réessayer » / « Nouveau paiement »: the wallet, with its sheet open. */
const RECHARGER = '/client/wallet?recharger=1';

type Look = 'succes' | 'danger' | 'attention' | 'neutre' | 'attente';

const LOOK: Record<Look, string> = {
  succes: 'bg-de9-teal-soft text-de9-teal-dark',
  danger: 'bg-de9-red-soft text-de9-red',
  attention: 'bg-de9-orange/20 text-de9-orange-deep',
  neutre: 'bg-secondary text-de9-gray',
  attente: 'bg-de9-blue-tint text-de9-blue',
};

/** The icon in its circle, the status and the server's sentence. */
function Hero({ look, icon, titre, message, children }: { look: Look; icon: ReactNode; titre: string; message?: string | null; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className={cn('grid size-16 place-items-center rounded-full', LOOK[look])}>{icon}</span>
      <h2 className="text-[19px] font-extrabold text-de9-ink">{titre}</h2>
      {message && <p className="max-w-[46ch] text-[13.5px] text-de9-slate">{message}</p>}
      {children}
    </div>
  );
}

function Ligne({ label, value, mono, big }: { label: string; value?: string | null; mono?: boolean; big?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-[13px] text-de9-gray">{label}</dt>
      <dd
        dir="ltr"
        className={cn(
          'min-w-0 text-end font-semibold break-all text-de9-ink',
          big ? 'text-[19px] font-black tabular-nums' : 'text-[13px]',
          mono && 'font-mono text-[12.5px]',
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/** Reference and amount — what every state but the success page shows. */
function Resume({ p }: { p: Paiement }) {
  const L = useL();
  if (!p.reference && !p.montantLabel) return null;
  return (
    <Card>
      <CardContent className="px-4 py-1">
        <dl className="divide-y divide-border">
          <Ligne label={L('Référence de la commande', 'مرجع الطلب')} value={p.reference} mono />
          <Ligne label={L('Montant', 'المبلغ')} value={p.montantLabel} />
        </dl>
      </CardContent>
    </Card>
  );
}

/** Back to SATIM's page — the same tab, as on the first trip. */
function reprendre(p: Paiement): void {
  if (!p.reprendreUrl?.startsWith('https://')) return;
  rememberPaiement(p.id, p.reference);
  window.location.assign(p.reprendreUrl);
}

/**
 * `approuve` — the page SATIM certifies the site on: the nine fields in this
 * order, then « Imprimer », « Télécharger PDF » and « Envoyer par e-mail ».
 */
function Succes({ p }: { p: Paiement }) {
  const L = useL();
  const navigate = useNavigate();
  const [busy, setBusy] = useState<'imprimer' | 'telecharger' | 'email' | 'banque' | null>(null);
  const hrefs = p.hrefs;

  const run = async (what: NonNullable<typeof busy>, action: () => Promise<void>) => {
    setBusy(what);
    try {
      await action();
    } catch (error) {
      // A PDF call's refusal arrives as a Blob: read it before its `code`.
      const problem = await toProblemOfBlob(error);
      const message = problem.detail ?? L("L'action n'a pas pu aboutir. Réessayez.", 'تعذّر تنفيذ الإجراء. أعد المحاولة.');
      toast.error(
        message,
        problem.code === 'email_non_verifie'
          ? { action: { label: L('Mon profil', 'ملفي'), onClick: () => navigate('/client/profile') } }
          : undefined,
      );
    } finally {
      setBusy(null);
    }
  };

  const ouvrirRecuBanque = async (href: string) => {
    // Opened in the press itself, filled once the link is known: a tab opened after the call would be blocked.
    const tab = window.open('', '_blank');
    try {
      const url = await recuBanqueUrl(href);
      if (!url.startsWith('https://')) throw new Error('url');
      if (tab) {
        tab.opener = null;
        tab.location.replace(url);
      } else window.open(url, '_blank', 'noopener');
    } catch (error) {
      tab?.close();
      throw error;
    }
  };

  return (
    <>
      <Hero look="succes" icon={<Check className="size-8" strokeWidth={3} />} titre={p.statutLabel ?? L('Payé', 'تم الدفع')} message={p.message}>
        {p.creditsLabel && (
          <p className="text-[17px] font-black text-de9-teal" dir="ltr">
            +{p.creditsLabel}
          </p>
        )}
        {p.payeur?.nom && <p className="text-[12.5px] text-de9-gray">{L(`Payé par ${p.payeur.nom}`, `دفع من طرف ${p.payeur.nom}`)}</p>}
      </Hero>

      <Card>
        <CardContent className="px-4 py-1">
          <dl className="divide-y divide-border">
            <Ligne label={L('Message de la banque', 'رسالة البنك')} value={p.satim?.messageBanque ?? L('Paiement accepté', 'تم قبول الدفع')} />
            <Ligne label={L('Référence de la commande', 'مرجع الطلب')} value={p.reference} mono />
            <Ligne label={L('Date et heure (GMT+1)', 'التاريخ والوقت (GMT+1)')} value={p.satim?.dateHeure} />
            <Ligne label={L('Mode de paiement', 'طريقة الدفع')} value={p.satim?.moyen ?? 'CIB / Edahabia'} />
            <Ligne label={L('Montant', 'المبلغ')} value={p.montantLabel} big />
            <Ligne label={L('N° de transaction SATIM', 'رقم معاملة SATIM')} value={p.satim?.orderId} mono />
            <Ligne label={L('N° de commande GuiddiniPay', 'رقم طلب GuiddiniPay')} value={p.satim?.orderNumber} mono />
            <Ligne label={L("N° d'autorisation", 'رقم الترخيص')} value={p.satim?.approvalCode} mono />
            <Ligne label={L('Carte', 'البطاقة')} value={p.satim?.panMasque} mono />
          </dl>
        </CardContent>
      </Card>

      {hrefs && (
        <div className="flex flex-col gap-2 sm:flex-row">
          {(hrefs.recuApercu ?? hrefs.recu) && (
            <Button
              variant="outline"
              className="flex-1"
              disabled={!!busy}
              onClick={() => void run('imprimer', () => openAuthedFile(apiUrl(hrefs.recuApercu ?? hrefs.recu ?? '')))}
            >
              {busy === 'imprimer' ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
              {L('Imprimer', 'طباعة')}
            </Button>
          )}
          {hrefs.recu && (
            <Button className="flex-1" disabled={!!busy} onClick={() => void run('telecharger', () => telechargerRecu(hrefs.recu ?? '', p.reference))}>
              {busy === 'telecharger' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              {L('Télécharger PDF', 'تنزيل PDF')}
            </Button>
          )}
          {/* Absent for de9de9 staff: the receipt only goes to the payer's own e-mail. */}
          {hrefs.envoyerRecu && (
            <Button
              variant="outline"
              className="flex-1"
              disabled={!!busy}
              onClick={() =>
                void run('email', async () => {
                  const message = await envoyerRecu(hrefs.envoyerRecu ?? '');
                  toast.success(message ?? L('Le reçu a été envoyé.', 'تم إرسال الإيصال.'));
                })
              }
            >
              {busy === 'email' ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
              {L('Envoyer par e-mail', 'إرسال بالبريد')}
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-[12px] text-de9-gray">{L("Ce reçu n'est pas une facture.", 'هذا الإيصال ليس فاتورة.')}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
          {p.mouvementId && (
            <button
              type="button"
              onClick={() => navigate(`/client/wallet/mouvements/${encodeURIComponent(p.mouvementId ?? '')}`)}
              className="inline-flex cursor-pointer items-center gap-0.5 text-[13px] font-semibold text-de9-teal-dark hover:underline"
            >
              {L('Voir le mouvement', 'عرض الحركة')}
              <ChevronRight className="size-4 rtl:rotate-180" />
            </button>
          )}
          {hrefs?.recuBanque && (
            <button
              type="button"
              disabled={!!busy}
              onClick={() => void run('banque', () => ouvrirRecuBanque(hrefs.recuBanque ?? ''))}
              className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-de9-teal-dark hover:underline disabled:opacity-60"
            >
              {busy === 'banque' && <Loader2 className="size-3.5 animate-spin" />}
              {L('Reçu de la banque', 'إيصال البنك')}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/** SATIM's toll-free line — required on the failure page. */
function NumeroVert({ p }: { p: Paiement }) {
  if (!p.mentionNumeroVert) return null;
  const numero = p.numeroVertSatim ?? '3020';
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl border border-de9-line bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[13px] font-medium text-de9-ink">{p.mentionNumeroVert}</p>
      <a
        href={`tel:${numero}`}
        dir="ltr"
        className="inline-flex flex-none items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-[13px] font-bold text-de9-ink hover:bg-secondary/80"
      >
        <Phone className="size-3.5" /> {numero}
      </a>
    </div>
  );
}

function Etat({ p, late, onVerifier, verifying }: { p: Paiement; late: boolean; onVerifier: () => void; verifying: boolean }) {
  const L = useL();
  const navigate = useNavigate();
  const retour = (
    <Button variant="outline" onClick={() => navigate(WALLET)}>
      {L('Retour au portefeuille', 'العودة إلى المحفظة')}
    </Button>
  );
  const titre = p.statutLabel ?? L('Paiement en ligne', 'دفع إلكتروني');

  switch (p.statut) {
    case 'approuve':
      return (
        <>
          <Succes p={p} />
          <div className="flex justify-center">{retour}</div>
        </>
      );

    case 'refuse':
      return (
        <>
          <Hero look="danger" icon={<X className="size-8" strokeWidth={3} />} titre={titre} message={p.message ?? L('Votre transaction a été rejetée.', 'تم رفض معاملتك.')} />
          <Resume p={p} />
          <NumeroVert p={p} />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate(RECHARGER)}>{L('Réessayer', 'إعادة المحاولة')}</Button>
            {retour}
          </div>
        </>
      );

    case 'expire':
      return (
        <>
          <Hero look="neutre" icon={<Clock className="size-8" />} titre={titre} message={p.message} />
          <Resume p={p} />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate(RECHARGER)}>{L('Nouveau paiement', 'دفع جديد')}</Button>
            {retour}
          </div>
        </>
      );

    case 'echec_initiation':
      return (
        <>
          <Hero look="danger" icon={<TriangleAlert className="size-8" />} titre={titre} message={p.message} />
          <Resume p={p} />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate(RECHARGER)}>{L('Réessayer', 'إعادة المحاولة')}</Button>
            {retour}
          </div>
        </>
      );

    case 'a_verifier':
      return (
        <>
          <Hero look="attention" icon={<Info className="size-8" />} titre={titre} message={p.message} />
          <Resume p={p} />
          <div className="flex justify-center">{retour}</div>
        </>
      );

    case 'initiation':
    case 'en_attente': {
      // The bank declined one attempt, yet SATIM's page stays open: not a failure until it closes.
      if (p.message?.startsWith('Votre banque a refusé cette tentative')) {
        return (
          <>
            <Hero look="attention" icon={<TriangleAlert className="size-8" />} titre={titre} message={p.message} />
            <Resume p={p} />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              {p.reprendreUrl && <Button onClick={() => reprendre(p)}>{L('Réessayer le paiement', 'إعادة محاولة الدفع')}</Button>}
              {retour}
            </div>
          </>
        );
      }
      // Fifteen minutes on: the page stops asking; the server keeps checking for two days.
      if (late) {
        return (
          <>
            <Hero
              look="attention"
              icon={<Clock className="size-8" />}
              titre={titre}
              message={L(
                'Vous pouvez fermer cette page : votre portefeuille sera crédité dès la confirmation de la banque.',
                'يمكنك إغلاق هذه الصفحة: ستُضاف الأرصدة إلى محفظتك فور تأكيد البنك.',
              )}
            />
            <Resume p={p} />
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button onClick={onVerifier} disabled={verifying}>
                {verifying && <Loader2 className="size-4 animate-spin" />}
                {L('Vérifier à nouveau', 'تحقق مجددًا')}
              </Button>
              {retour}
            </div>
          </>
        );
      }
      return (
        <>
          <Hero look="attente" icon={<Loader2 className="size-8 animate-spin" />} titre={titre} message={p.message} />
          <Resume p={p} />
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            {p.reprendreUrl && (
              <Button variant="outline" onClick={() => reprendre(p)}>
                {L('Reprendre le paiement', 'متابعة الدفع')}
              </Button>
            )}
            {retour}
          </div>
        </>
      );
    }

    default:
      // A status this build does not know: the server's own words, and a way out.
      return (
        <>
          <Hero look={p.final ? 'neutre' : 'attente'} icon={p.final ? <Info className="size-8" /> : <Loader2 className="size-8 animate-spin" />} titre={titre} message={p.message} />
          <Resume p={p} />
          <div className="flex justify-center">{retour}</div>
        </>
      );
  }
}

function PaiementView({ id }: { id: string }) {
  const L = useL();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  // From the list: a payment already final is read as stored, without a bank call.
  const connuFinal = (location.state as { final?: unknown } | null)?.final === true;
  const query = usePaiement(id, connuFinal);
  const p = query.data;

  const [late, setLate] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setLate(true), POLL_FOR_MS);
    return () => clearTimeout(timer);
  }, []);

  const statut = p?.statut;
  const final = p?.final === true;
  useEffect(() => {
    if (!final) return;
    forgetPaiement(id);
    // Seen turning « payé » here: the wallet and the home's credits are reloaded on purpose.
    if (statut === 'approuve' && !connuFinal) void apresCredit(queryClient, id);
  }, [final, statut, id, connuFinal, queryClient]);

  const header = (
    <header className="flex items-center gap-3">
      <Button variant="outline" size="icon" onClick={() => navigate(WALLET)} aria-label={L('Retour au portefeuille', 'العودة إلى المحفظة')}>
        <ArrowLeft className="size-4 rtl:rotate-180" />
      </Button>
      <h1 className="text-xl font-extrabold text-de9-ink">{L('Paiement en ligne', 'دفع إلكتروني')}</h1>
    </header>
  );

  if (!p) {
    const problem = query.isError ? toProblem(query.error) : null;
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-5">
        {header}
        {problem ? (
          <EmptyState
            title={
              problem.status === 404
                ? (problem.detail ?? L('Ce paiement est introuvable.', 'هذا الدفع غير موجود.'))
                : L('Impossible de vérifier le paiement', 'تعذّر التحقق من الدفع')
            }
            description={problem.status === 404 ? undefined : (problem.detail ?? L('Réessayez dans un instant.', 'أعد المحاولة بعد لحظة.'))}
            action={
              <div className="flex gap-2">
                {problem.status !== 404 && (
                  <Button size="sm" onClick={() => void query.refetch()}>
                    {L('Réessayer', 'إعادة المحاولة')}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => navigate(WALLET)}>
                  {L('Retour au portefeuille', 'العودة إلى المحفظة')}
                </Button>
              </div>
            }
          />
        ) : (
          <Hero look="attente" icon={<Loader2 className="size-8 animate-spin" />} titre={L('Vérification du paiement…', 'جارٍ التحقق من الدفع…')} />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-5 pb-12">
      {header}
      <Etat p={p} late={late} verifying={query.isFetching} onVerifier={() => void query.refetch()} />
    </div>
  );
}

/**
 * One online payment — `/client/wallet/paiements/:id`, where the bank's
 * redirect ends up too. Only the server's answer says « payé »: the page asks
 * `/verification` until the payment is final, and never reads a result off its
 * own address.
 */
export function PaiementPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  // Keyed: another payment starts its own polling clock.
  return <PaiementView key={id} id={id} />;
}
