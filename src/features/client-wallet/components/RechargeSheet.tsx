import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Loader2, MessageCircle, Phone } from 'lucide-react';
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
    <section className="flex flex-col gap-3">
      <div>
        <h3 className="text-[15px] font-bold text-de9-ink">{enLigne.titre}</h3>
        {enLigne.texte && <p className="text-[12.5px] text-de9-slate">{enLigne.texte}</p>}
      </div>

      {enLigne.montantsSuggeres.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {enLigne.montantsSuggeres.map((m) => (
            <button
              key={m.dzd}
              type="button"
              disabled={busy}
              title={m.creditsLabel ?? undefined}
              aria-pressed={m.dzd === dzd}
              onClick={() => setMontant(String(m.dzd))}
              className={cn(
                'h-9 cursor-pointer rounded-full border px-3.5 text-[13px] font-bold transition-colors',
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

      <div>
        <div
          className={cn(
            'flex h-12 items-center gap-2 rounded-xl border bg-card px-3.5 focus-within:border-de9-teal',
            erreurMontant ? 'border-destructive' : 'border-input',
          )}
        >
          <input
            inputMode="numeric"
            autoComplete="off"
            dir="ltr"
            disabled={busy}
            value={saisie}
            onChange={(e) => setMontant(e.target.value)}
            placeholder={nf.format(enLigne.minDzd)}
            aria-label={L('Montant en dinars', 'المبلغ بالدينار')}
            aria-invalid={!!erreurMontant}
            className="min-w-0 flex-1 bg-transparent text-[18px] font-bold text-de9-ink tabular-nums outline-none placeholder:font-medium placeholder:text-de9-gray/60"
          />
          <span className="text-[14px] font-bold text-de9-gray">DA</span>
        </div>
        {erreurMontant ? (
          <p className="mt-1.5 text-[12px] text-destructive">{erreurMontant}</p>
        ) : (
          dzd > 0 && (
            <p className="mt-1.5 text-[13px] font-semibold text-de9-teal" dir="ltr">
              = {chip?.creditsLabel ?? `${nf.format(dzd * enLigne.creditsParDzd)} ${L('crédits', 'رصيد')}`}
            </p>
          )
        )}
      </div>

      {enLigne.payeurLabel && <p className="text-[12.5px] text-de9-slate">{enLigne.payeurLabel}</p>}

      {/* The terms: the server refuses a payment without them, and records the version accepted. */}
      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-[12.5px] text-de9-slate">
          <Checkbox
            className="mt-0.5"
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
        {refus?.champ === 'conditions' && refus.message && <p className="mt-1.5 text-[12px] text-destructive">{refus.message}</p>}
      </div>

      {/* CAPTCHA (SATIM checkout checklist): the provider is not chosen yet — its widget mounts here. */}
      <div id="paiement-captcha" className="empty:hidden" />

      {enLigne.logos.length > 0 && (
        <div className="flex items-center gap-2">
          {enLigne.logos.map((logo) => (
            <span
              key={logo}
              className="rounded-md border border-border bg-card px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-de9-ink uppercase"
            >
              {LOGO_LABEL[logo] ?? logo}
            </span>
          ))}
        </div>
      )}

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

      {(enLigne.mentionInteroperabilite || enLigne.mentionNumeroVert) && (
        <div className="flex flex-col gap-0.5 text-[11px] text-de9-gray">
          {enLigne.mentionInteroperabilite && <p>{enLigne.mentionInteroperabilite}</p>}
          {enLigne.mentionNumeroVert && <p>{enLigne.mentionNumeroVert}</p>}
        </div>
      )}
    </section>
  );
}

/**
 * « Recharger mes crédits ». With `feuille.enLigne`: the card payment block,
 * then « Autres moyens ». Without it (the feature is off, de9de9 staff, a
 * company outside the pilot list): the contact sheet alone — one button per
 * channel de9de9 configured and the bank-transfer tile, nothing sent.
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
        <DialogHeader>
          <DialogTitle>{feuille.titre}</DialogTitle>
          {feuille.sousTitre && <DialogDescription>{feuille.sousTitre}</DialogDescription>}
        </DialogHeader>

        {feuille.info && (
          <p className="flex items-start gap-2 rounded-lg bg-secondary px-3.5 py-3 text-[13px] text-de9-slate">
            <Info className="mt-0.5 size-4 flex-none text-de9-blue" />
            {feuille.info}
          </p>
        )}

        {feuille.enLigne && (
          <>
            <PayerEnLigne enLigne={feuille.enLigne} busy={busy} setBusy={setBusy} onGone={onRefresh} />
            {feuille.autresMoyensTitre && (
              <div className="flex items-center gap-3 text-[12px] font-semibold text-de9-gray">
                <span className="h-px flex-1 bg-border" />
                {feuille.autresMoyensTitre}
                <span className="h-px flex-1 bg-border" />
              </div>
            )}
          </>
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
      </DialogContent>
    </Dialog>
  );
}
