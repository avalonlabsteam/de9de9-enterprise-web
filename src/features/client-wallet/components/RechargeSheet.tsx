import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, ChevronRight, Coins, CreditCard, Info, Loader2, MessageCircle, Phone, PhoneCall, ShieldCheck, TriangleAlert, UserRound, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useL } from '@/lib/i18n';
import { toProblem } from '@/api/problem';
import { useLangStore } from '@/stores/langStore';
import { ApiIcon } from '@/components/common/ApiIcon';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { initierPaiement, PaiementExpireError, rememberPaiement, type InitierPaiementBody } from '../api/paiements';
import type { PaiementInitie } from '../schemas/paiements';
import type { EnLigne, FeuilleRecharge } from '../schemas/portefeuille';

function CanalIcon({ code }: { code?: string | null }) {
  return code === 'whatsapp' ? <MessageCircle className="size-4" /> : <Phone className="size-4" />;
}

/** Grouped like the server's labels: the thousands separator is U+202F. */
const nf = new Intl.NumberFormat('fr-FR');
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const LOGO_LABEL: Record<string, string> = { cib: 'CIB', edahabia: 'Edahabia' };

/**
 * « Payer en ligne » — an amount, the terms, and « Payer »: the server opens
 * an order with the bank and answers the address of SATIM's card page, which
 * this tab then goes to (never a frame, never a popup). Limits, suggestions and
 * every notice come from the wallet's answer; the one thing computed here is
 * « = N crédits » under the input.
 *
 * Read top to bottom: what the block is, the amount (the one thing typed), who
 * pays and the terms, « Payer » — then the bank's notices, quiet under it.
 */
function PayerEnLigne({ enLigne, busy, setBusy, onGone }: {
  enLigne: EnLigne;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  /** Online payment is no longer offered: reload the wallet, the block disappears. */
  onGone: () => void;
}) {
  const L = useL();
  const navigate = useNavigate();
  const lang = useLangStore((s) => s.lang);
  const [saisie, setSaisie] = useState('');
  const [accepte, setAccepte] = useState(false);
  const [touched, setTouched] = useState(false);
  /** What the server said about one of the two inputs (422). */
  const [refus, setRefus] = useState<{ champ: 'montant' | 'conditions'; message: string } | null>(null);
  /**
   * The confirmation's `Idempotency-Key`: a new UUID when the amount changes
   * and after ANY answer; the same one only when the previous press got no
   * answer at all (network error, timeout), so that press cannot pay twice.
   */
  const key = useRef<string | null>(null);

  const montant = saisie.replace(/\s/g, '');
  const entier = /^\d+$/.test(montant);
  const dzd = entier ? Number(montant) : 0;
  const dansLimites = entier && dzd >= enLigne.minDzd && dzd <= enLigne.maxDzd;
  const limites = L(
    `Le montant doit être compris entre ${nf.format(enLigne.minDzd)} DA et ${nf.format(enLigne.maxDzd)} DA.`,
    `يجب أن يكون المبلغ بين ${nf.format(enLigne.minDzd)} دج و ${nf.format(enLigne.maxDzd)} دج.`,
  );
  const erreurMontant =
    montant === ''
      ? null
      : !entier
        ? L('Montant en dinars entiers.', 'المبلغ بالدينار دون فواصل.')
        : !dansLimites
          ? limites
          : refus?.champ === 'montant'
            ? refus.message
            : null;
  const valide = dansLimites && accepte;
  const chip = enLigne.montantsSuggeres.find((m) => m.dzd === dzd);

  const setMontant = (value: string) => {
    setSaisie(value);
    setRefus(null);
    key.current = null; // another amount is another confirmation
  };

  /** Send, following what the server says about the key (guide 17 §2). */
  const lancer = async (body: InitierPaiementBody): Promise<PaiementInitie> => {
    let rekeyed = false;
    for (let attempt = 0; ; attempt++) {
      key.current ??= crypto.randomUUID();
      try {
        return await initierPaiement(body, key.current);
      } catch (error) {
        const code = error instanceof PaiementExpireError ? 'expire' : toProblem(error).code;
        // The first attempt is still talking to the bank: same key, a little later.
        if (code === 'paiement_en_cours' && attempt < 10) {
          await wait(3_000);
          continue;
        }
        // That key's attempt ended without a payable page, and nothing was debited: once more, on a new key.
        if ((code === 'paiement_deja_finalise' || code === 'expire') && !rekeyed) {
          rekeyed = true;
          key.current = null;
          continue;
        }
        throw error;
      }
    }
  };

  const payer = async () => {
    setTouched(true);
    if (!valide || busy) return;
    setBusy(true);
    setRefus(null);
    try {
      const paiement = await lancer({ montantDzd: dzd, langue: lang === 'ar' ? 'ar' : 'fr', accepteConditions: true });
      if (!paiement.formUrl.startsWith('https://')) throw new Error('form_url');
      rememberPaiement(paiement.paiementId, paiement.reference);
      // SATIM's page, in its own browsing context. The button stays busy while the tab leaves.
      window.location.assign(paiement.formUrl);
    } catch (error) {
      setBusy(false);
      const problem = toProblem(error);
      // Only a press that got no answer keeps its key.
      if (problem.code !== 'network') key.current = null;
      const fallback =
        problem.code === 'network'
          ? L('Connexion impossible. Aucun montant n’a été débité : réessayez.', 'تعذّر الاتصال. لم يُخصم أي مبلغ: أعد المحاولة.')
          : L("Le paiement n'a pas pu être lancé. Aucun montant n'a été débité : réessayez.", 'تعذّر بدء الدفع. لم يُخصم أي مبلغ: أعد المحاولة.');
      switch (problem.code) {
        case 'montant_hors_limites':
          setRefus({ champ: 'montant', message: problem.detail ?? limites });
          break;
        case 'conditions_non_acceptees':
          setAccepte(false);
          setRefus({ champ: 'conditions', message: problem.detail ?? '' });
          break;
        case 'paiement_en_ligne_indisponible':
          toast.error(problem.detail ?? fallback);
          onGone();
          break;
        case 'paiements_en_cours_trop_nombreux':
          toast.error(problem.detail ?? fallback, {
            action: { label: L('Paiements en ligne', 'المدفوعات الإلكترونية'), onClick: () => navigate('/client/wallet/paiements') },
          });
          break;
        default:
          toast.error(problem.detail ?? fallback);
      }
    }
  };

  const conditionsRouges = (touched && !accepte) || refus?.champ === 'conditions';

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border p-4">
      {/* What this block is — and the cards it takes, beside its name */}
      <div className="flex items-start gap-3">
        <span className="grid size-10 flex-none place-items-center rounded-xl bg-de9-teal text-primary-foreground">
          <CreditCard className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-[15px] font-bold text-de9-ink">{enLigne.titre}</h3>
            {enLigne.logos.map((logo) => (
              <span
                key={logo}
                className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-de9-slate uppercase"
              >
                {LOGO_LABEL[logo] ?? logo}
              </span>
            ))}
          </div>
          {enLigne.texte && <p className="mt-0.5 text-[12.5px] text-de9-slate">{enLigne.texte}</p>}
        </div>
      </div>

      {/* The amount: the usual ones are one tap away, any other is typed */}
      <div className="flex flex-col gap-2">
        <label htmlFor="recharge-montant" className="text-[12px] font-semibold text-de9-gray">
          {L('Montant', 'المبلغ')}
        </label>
        {enLigne.montantsSuggeres.length > 0 && (
          // Four across once the sheet has its full width; a cell is then just wider than « 500 000 DA ».
          <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-4">
            {enLigne.montantsSuggeres.map((m) => (
              <button
                key={m.dzd}
                type="button"
                disabled={busy}
                title={m.creditsLabel ?? undefined}
                aria-pressed={m.dzd === dzd}
                onClick={() => setMontant(String(m.dzd))}
                className={cn(
                  'h-9 cursor-pointer rounded-full border px-1 text-[13px] font-bold whitespace-nowrap transition-colors',
                  m.dzd === dzd
                    ? 'border-de9-teal bg-de9-teal-soft text-de9-teal-dark'
                    : 'border-border bg-card text-de9-ink hover:border-de9-teal',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
        <div
          className={cn(
            'flex h-14 items-center gap-2.5 rounded-xl border bg-card px-4 focus-within:border-de9-teal focus-within:ring-2 focus-within:ring-de9-teal/25',
            erreurMontant ? 'border-destructive' : 'border-input',
          )}
        >
          <Banknote className="size-5 flex-none text-de9-gray" />
          <input
            id="recharge-montant"
            inputMode="numeric"
            autoComplete="off"
            dir="ltr"
            disabled={busy}
            value={saisie}
            onChange={(e) => setMontant(e.target.value)}
            placeholder={nf.format(enLigne.minDzd)}
            aria-invalid={!!erreurMontant}
            className="min-w-0 flex-1 bg-transparent text-[22px] font-bold text-de9-ink tabular-nums outline-none placeholder:font-medium placeholder:text-de9-gray/60"
          />
          <span className="flex-none rounded-md bg-secondary px-2 py-1 text-[12px] font-bold text-de9-slate">DA</span>
        </div>
        {erreurMontant ? (
          <p className="flex items-center gap-1.5 text-[12px] text-destructive">
            <TriangleAlert className="size-3.5 flex-none" />
            {erreurMontant}
          </p>
        ) : (
          dzd > 0 && (
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-de9-teal-dark">
              <Coins className="size-4 flex-none" />
              <span dir="ltr">= {chip?.creditsLabel ?? `${nf.format(dzd * enLigne.creditsParDzd)} ${L('crédits', 'رصيد')}`}</span>
            </p>
          )
        )}
      </div>

      {/* Who pays, and the terms: the server refuses a payment without them, and records the version accepted. */}
      <div className="flex flex-col gap-2 rounded-xl bg-secondary/60 px-3.5 py-2.5">
        {enLigne.payeurLabel && (
          <p className="flex items-center gap-2 text-[12.5px] font-semibold text-de9-ink">
            <UserRound className="size-4 flex-none text-de9-gray" />
            {enLigne.payeurLabel}
          </p>
        )}
        <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] text-de9-slate">
          <Checkbox
            className="mt-0.5 bg-card"
            checked={accepte}
            disabled={busy}
            aria-invalid={conditionsRouges}
            onCheckedChange={(checked) => {
              setAccepte(checked === true);
              setRefus(null);
            }}
          />
          <span>
            {enLigne.conditionsLabel ?? L("J'accepte les conditions générales de paiement en ligne.", 'أوافق على الشروط العامة للدفع الإلكتروني.')}{' '}
            {enLigne.conditionsUrl && (
              <a
                href={enLigne.conditionsUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-de9-teal-dark underline underline-offset-2"
              >
                {L('Lire les conditions', 'قراءة الشروط')}
              </a>
            )}
          </span>
        </label>
        {refus?.champ === 'conditions' && refus.message && <p className="text-[12px] text-destructive">{refus.message}</p>}
      </div>

      {/* CAPTCHA (SATIM checkout checklist): the provider is not chosen yet — its widget mounts here. */}
      <div id="paiement-captcha" className="empty:hidden" />

      <button
        type="button"
        onClick={() => void payer()}
        disabled={busy || !valide}
        className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-de9-teal text-[15px] font-bold text-primary-foreground shadow-glow transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <ApiIcon code={enLigne.action.icone ?? 'carte'} className="size-5" />}
        {busy ? (
          L('Connexion à la banque…', 'جارٍ الاتصال بالبنك…')
        ) : (
          <span dir="ltr">
            {enLigne.action.label}
            {dansLimites && ` ${chip?.label ?? `${nf.format(dzd)} DA`}`}
          </span>
        )}
      </button>

      {/* The bank's notices: they must be on the screen, not in the way. */}
      {(enLigne.mentionInteroperabilite || enLigne.mentionNumeroVert) && (
        <ul className="flex flex-col gap-1.5 text-[11px] leading-snug text-de9-gray">
          {enLigne.mentionInteroperabilite && (
            <li className="flex items-start gap-1.5">
              <ShieldCheck className="mt-px size-3.5 flex-none" />
              {enLigne.mentionInteroperabilite}
            </li>
          )}
          {enLigne.mentionNumeroVert && (
            <li className="flex items-start gap-1.5">
              <PhoneCall className="mt-px size-3.5 flex-none" />
              {enLigne.mentionNumeroVert}
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

/**
 * Under the card block: the other ways in, as quiet rows — « Payer » stays the
 * one button of the sheet. The bank transfer is a row without a link: its RIB
 * comes from the client's adviser.
 */
function AutresMoyens({ feuille }: { feuille: FeuilleRecharge }) {
  if (feuille.canaux.length === 0 && !feuille.virement) return null;
  return (
    <section className="flex flex-col gap-2">
      {feuille.autresMoyensTitre && <h3 className="text-[12px] font-semibold text-de9-gray">{feuille.autresMoyensTitre}</h3>}
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {feuille.canaux.map((canal) => (
          <li key={canal.href}>
            <a
              href={canal.href}
              target={canal.href.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="flex items-center gap-3 px-3.5 py-2 transition-colors hover:bg-secondary/60"
            >
              <span
                className={cn(
                  'grid size-8 flex-none place-items-center rounded-full',
                  canal.code === 'whatsapp'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                    : 'bg-de9-teal-soft text-de9-teal-dark',
                )}
              >
                <CanalIcon code={canal.code} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-de9-ink">{canal.label}</span>
              <ChevronRight className="size-4 flex-none text-de9-gray rtl:rotate-180" />
            </a>
          </li>
        ))}
        {feuille.virement && (
          <li className="flex items-start gap-3 px-3.5 py-2">
            <span className="grid size-8 flex-none place-items-center rounded-full bg-de9-blue-tint text-de9-blue">
              <ApiIcon code={feuille.virement.icone ?? 'banque'} className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-de9-ink">{feuille.virement.titre}</p>
              {feuille.virement.texte && <p className="mt-0.5 text-[12.5px] text-de9-slate">{feuille.virement.texte}</p>}
            </div>
          </li>
        )}
      </ul>
    </section>
  );
}

/**
 * « Recharger mes crédits ». With `feuille.enLigne`: the card payment block,
 * then « Autres moyens » as quiet rows. Without it (the feature is off, de9de9
 * staff, a company outside the pilot list): the contact sheet alone — one
 * button per channel de9de9 configured and the bank-transfer tile, nothing sent.
 */
export function RechargeSheet({
  feuille,
  onClose,
  onRefresh,
}: {
  feuille: FeuilleRecharge;
  onClose: () => void;
  /** Reload the wallet (and so this sheet's content). */
  onRefresh: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    // Not closable while « Payer » talks to the bank: a second press must not get through.
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader className="flex-row items-center gap-3 pe-8">
          <span className="grid size-11 flex-none place-items-center rounded-xl bg-de9-teal-soft text-de9-teal-dark">
            <Wallet className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col items-start gap-1.5">
            <DialogTitle className="text-[17px] leading-tight font-bold text-de9-ink">{feuille.titre}</DialogTitle>
            {feuille.sousTitre && (
              <DialogDescription className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-[12px] font-semibold text-de9-slate">
                <Coins className="size-3.5 flex-none" />
                {feuille.sousTitre}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        {feuille.enLigne ? (
          // The two ways in are on the sheet themselves: the sentence that announces them (`info`) is left out.
          <>
            <PayerEnLigne enLigne={feuille.enLigne} busy={busy} setBusy={setBusy} onGone={onRefresh} />
            <AutresMoyens feuille={feuille} />
          </>
        ) : (
          <>
            {feuille.info && (
              <p className="flex items-start gap-2 rounded-lg bg-secondary px-3.5 py-3 text-[13px] text-de9-slate">
                <Info className="mt-0.5 size-4 flex-none text-de9-blue" />
                {feuille.info}
              </p>
            )}

            <div className="flex flex-col gap-2">
              {feuille.canaux.map((canal) => (
                <a
                  key={canal.href}
                  href={canal.href}
                  target={canal.href.startsWith('http') ? '_blank' : undefined}
                  rel="noreferrer"
                  className={cn(
                    'flex h-11 items-center justify-center gap-2 rounded-full px-4 text-[14px] font-bold',
                    canal.principal
                      ? 'bg-de9-teal text-primary-foreground shadow-glow hover:brightness-95'
                      : 'bg-secondary text-de9-ink hover:bg-secondary/80',
                  )}
                >
                  <CanalIcon code={canal.code} />
                  {canal.label}
                </a>
              ))}
            </div>

            {/* A tile, not a button: the RIB comes from the client's adviser. */}
            {feuille.virement && (
              <div className="flex items-start gap-3 rounded-lg bg-secondary/60 px-3.5 py-3">
                <span className="grid size-9 flex-none place-items-center rounded-full bg-card text-de9-ink">
                  <ApiIcon code={feuille.virement.icone ?? 'banque'} className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-de9-ink">{feuille.virement.titre}</p>
                  {feuille.virement.texte && <p className="mt-0.5 text-[12.5px] text-de9-slate">{feuille.virement.texte}</p>}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
