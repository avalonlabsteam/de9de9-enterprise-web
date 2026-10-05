import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Eye, ShieldCheck, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/common/Logo';
import { PieceSlot, type PieceFile } from '@/components/common/PieceSlot';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useT, useL } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { tonePill } from '@/lib/tones';
import { toProblem } from '@/api/problem';
import { openAuthedFile } from '@/lib/authedFile';
import { kycStateOfDossier, useKycDossier, useSubmitKyc } from '../api/kyc';
import {
  KYC_KINDS,
  MAX_FILE_BYTES,
  MAX_REQUEST_BYTES,
  type KycDocument,
  type KycKind,
  type KycPieceStatut,
} from '../schemas/kyc';

const ACCEPT = 'application/pdf,image/*';

/**
 * The chip of a piece on the dossier: the API's label, in the colour of its
 * status. Arabic goes by status — the API words French only. An empty slot
 * has none: it says « Importer » itself.
 */
const PIECE_CHIP: Record<KycPieceStatut, { ton: string; fr: string; ar: string } | null> = {
  manquant: null,
  a_verifier: { ton: 'info', fr: 'En vérification', ar: 'قيد التحقق' },
  valide: { ton: 'valide', fr: 'Validé', ar: 'مقبولة' },
  refuse: { ton: 'danger', fr: 'Refusé · à remplacer', ar: 'مرفوضة · للاستبدال' },
};

/** « 2 documents à corriger », at most three. */
const A_CORRIGER_AR = ['وثيقة واحدة للتصحيح', 'وثيقتان للتصحيح', '3 وثائق للتصحيح'];

type Picked = Partial<Record<KycKind, PieceFile>>;

/**
 * « Vérifier mon entreprise » — the company files RC, NIF and NIS. Sending them
 * is the whole step: a filed piece waits for de9de9 at once. Same screen for
 * both sides: the company comes from the token, so no id travels in the URL.
 *
 * It is also the screen a rejection lands on: de9de9 rules on each piece, so a
 * refused one shows its reason and asks for a new file, while a validated one
 * stays in place.
 *
 * `exitTo` offers « plus tard »: a sign-in can land here outside the shell,
 * with no other way into the app.
 */
export function KycForm({
  successPath,
  subtitle,
  exitTo,
}: {
  successPath: string;
  subtitle: string;
  exitTo?: string;
}) {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const [picked, setPicked] = useState<Picked>({});
  // Pieces on the dossier the user took off to replace: shown empty, with
  // their file input, until a new file is picked.
  const [cleared, setCleared] = useState<ReadonlySet<KycKind>>(() => new Set());
  // Upload progress in percent while the files are on their way, else null.
  const [progress, setProgress] = useState<number | null>(null);

  const dossierQuery = useKycDossier();
  const submit = useSubmitKyc();
  const kyc = kycStateOfDossier(dossierQuery.data);
  const progression = dossierQuery.data?.progression;

  const labels: Record<KycKind, string> = {
    KycRc: t('kycRc'),
    KycNif: t('kycNif'),
    KycNis: t('kycNis'),
  };
  const hints: Record<KycKind, string> = {
    KycRc: L('PDF ou photo', 'PDF أو صورة'),
    KycNif: L("Numéro d'identification fiscale", 'رقم التعريف الجبائي'),
    KycNis: L("Numéro d'identification statistique", 'رقم التعريف الإحصائي'),
  };

  const stored = (kind: KycKind): KycDocument | undefined =>
    dossierQuery.data?.documents.find((d) => d.kind === kind);

  /**
   * Refused by de9de9: the file on the dossier no longer counts, a new one must
   * replace it. (While the round is open the API shows it « en vérification ».)
   */
  const refused = (kind: KycKind) => stored(kind)?.statut === 'refuse';
  const aCorriger = KYC_KINDS.filter(refused).length;

  /** The piece on the dossier, unless it was refused or the user took it off to replace it. */
  const kept = (kind: KycKind): KycDocument | undefined => {
    const doc = stored(kind);
    return doc?.present && !refused(kind) && !cleared.has(kind) ? doc : undefined;
  };

  /** A piece counts as filed if it is kept on the dossier or just picked. */
  const filed = (kind: KycKind) => !!picked[kind] || !!kept(kind);
  const missing = KYC_KINDS.filter((kind) => !filed(kind));
  /** The new files: a piece already on the dossier is not sent again. */
  const toSend = KYC_KINDS.flatMap((kind) => {
    const file = picked[kind]?.file;
    return file ? [{ kind, file }] : [];
  });

  const onPiece = (kind: KycKind, file: PieceFile | null) => {
    if (file) {
      setPicked((prev) => ({ ...prev, [kind]: file }));
      setCleared((prev) => {
        const next = new Set(prev);
        next.delete(kind);
        return next;
      });
    } else if (picked[kind]) {
      setPicked((prev) => {
        const next = { ...prev };
        delete next[kind];
        return next;
      });
    } else {
      // The ✕ on a piece already filed: nothing picked to drop, so hide it to
      // offer the file input — a rejected dossier must be correctable.
      setCleared((prev) => new Set(prev).add(kind));
    }
  };

  const onSubmit = async () => {
    if (toSend.reduce((sum, f) => sum + f.file.size, 0) > MAX_REQUEST_BYTES) {
      toast.error(L('Envoi trop lourd : 20 Mo maximum par envoi.', 'الإرسال ثقيل: 20 ميغابايت كحد أقصى.'));
      return;
    }

    try {
      setProgress(0);
      await submit.mutateAsync({ files: toSend, onProgress: setProgress }).finally(() => setProgress(null));
      setPicked({});
      setCleared(new Set());
      navigate(successPath);
    } catch (error) {
      const problem = toProblem(error);
      // The dossier moved under this screen (a verdict, another seat): the
      // files were picked against an older one. Drop them and show where it
      // stands now.
      if (problem.status === 409) {
        setPicked({});
        setCleared(new Set());
        void dossierQuery.refetch();
      }
      if (problem.code === 'kyc_under_review') {
        toast.error(
          problem.detail ??
            L(
              'Cette pièce est en cours de vérification : attendez la décision de de9de9 avant de la remplacer.',
              'هذه الوثيقة قيد التحقق: انتظر قرار de9de9 قبل استبدالها.',
            ),
        );
      } else if (problem.code === 'kyc_document_approved_locked') {
        toast.error(
          problem.detail ??
            L(
              'Cette pièce est déjà validée : elle ne peut plus être remplacée.',
              'هذه الوثيقة مقبولة بالفعل: لا يمكن استبدالها.',
            ),
        );
      } else if (problem.status === 403) {
        toast.error(
          L(
            "Seul le compte administrateur de l'entreprise peut déposer le dossier.",
            'يمكن لحساب مدير الشركة فقط إيداع الملف.',
          ),
        );
      } else if (problem.status === 413 || problem.status === 415) {
        toast.error(
          problem.detail ?? L('Fichier trop lourd ou non pris en charge.', 'ملف ثقيل أو غير مدعوم.'),
        );
      } else {
        toast.error(problem.detail ?? L('Envoi impossible. Réessayez.', 'تعذّر الإرسال. أعد المحاولة.'));
      }
    }
  };

  const preview = async (url: string) => {
    try {
      await openAuthedFile(url);
    } catch {
      toast.error(L("Impossible d'ouvrir la pièce.", 'تعذّر فتح الوثيقة.'));
    }
  };

  const busy = submit.isPending;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-modal">
          <CardContent className="p-6 sm:p-7">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-[12px] bg-de9-teal-soft text-de9-teal-dark">
                <ShieldCheck className="size-5" />
              </span>
              <h1 className="text-xl font-extrabold text-de9-ink">{t('kycTitle')}</h1>
            </div>
            <p className="mt-1 text-[13px] text-de9-slate">{subtitle}</p>

            {kyc.rejected && (
              <div className="mt-4 flex gap-2.5 rounded-lg bg-destructive/10 px-3.5 py-3 text-destructive">
                <TriangleAlert className="mt-0.5 size-4 flex-none" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold">
                    {aCorriger > 0
                      ? L(`${aCorriger} document${aCorriger > 1 ? 's' : ''} à corriger`, A_CORRIGER_AR[aCorriger - 1] ?? '')
                      : L('Dossier refusé', 'تم رفض الملف')}
                  </p>
                  {/* An older rejection has one reason for the whole dossier; since, each refused piece prints its own. */}
                  {aCorriger === 0 && kyc.motif && <p className="mt-0.5 text-[12.5px]">{kyc.motif}</p>}
                  <p className="mt-1 text-[12px]">
                    {L(
                      'Remplacez la pièce concernée, puis envoyez vos documents.',
                      'استبدل الوثيقة المعنية ثم أرسل وثائقك.',
                    )}
                  </p>
                </div>
              </div>
            )}

            {kyc.inReview && (
              <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-accent px-3.5 py-3 text-de9-teal-dark">
                <Clock className="size-4 flex-none" />
                <p className="min-w-0 flex-1 text-[12.5px]">
                  {L('Dossier en cours de vérification.', 'الملف قيد التحقق.')}
                </p>
                {progression?.libelle && (
                  <span className="flex-none text-[12px] font-bold">
                    {L(progression.libelle, `${progression.valides} / ${progression.total} مقبولة`)}
                  </span>
                )}
              </div>
            )}

            <div className="mt-5 space-y-3">
              {KYC_KINDS.map((kind) => {
                const doc = kept(kind);
                const value = picked[kind] ?? (doc ? { name: doc.fileName ?? '' } : null);
                // Under the slot: the file on the dossier, until a new one covers it.
                const toReplace = refused(kind) && !picked[kind];
                const onFile = picked[kind] ? undefined : (doc ?? (toReplace ? stored(kind) : undefined));
                const link = onFile?.urlApercu ?? onFile?.url;
                const chip = onFile?.statut ? PIECE_CHIP[onFile.statut] : null;
                return (
                  <div key={kind} className="space-y-1">
                    <PieceSlot
                      label={labels[kind]}
                      hint={hints[kind]}
                      accept={ACCEPT}
                      maxBytes={MAX_FILE_BYTES}
                      onReject={() =>
                        toast.error(L('Fichier trop lourd : 10 Mo maximum.', 'الملف ثقيل: 10 ميغابايت كحد أقصى.'))
                      }
                      value={value}
                      onChange={(file) => onPiece(kind, file)}
                      // The API's word: a validated piece, or one waiting for its verdict, stays (409).
                      locked={!!doc && !picked[kind] && doc.remplacable === false}
                    />
                    {(chip || link) && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 ps-1 text-[12px]">
                        {chip && (
                          <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', tonePill(chip.ton))}>
                            {L(onFile?.statutLabel ?? chip.fr, chip.ar)}
                          </span>
                        )}
                        {link && (
                          <button
                            type="button"
                            onClick={() => void preview(link)}
                            className="inline-flex items-center gap-1.5 font-semibold text-de9-teal-dark hover:underline"
                          >
                            <Eye className="size-3.5" />
                            {toReplace
                              ? L('Voir la pièce refusée', 'عرض الوثيقة المرفوضة')
                              : L('Voir la pièce déposée', 'عرض الوثيقة المودعة')}
                          </button>
                        )}
                      </div>
                    )}
                    {toReplace && onFile?.motif && <p className="ps-1 text-[12px] text-destructive">{onFile.motif}</p>}
                  </div>
                );
              })}

              <Button
                type="button"
                size="lg"
                onClick={() => void onSubmit()}
                className="mt-2 h-11 w-full text-[15px]"
                disabled={busy || toSend.length === 0 || missing.length > 0}
              >
                {busy
                  ? progress !== null
                    ? L(`Envoi… ${progress}\u00a0%`, `جارٍ الإرسال… ${progress}\u00a0%`)
                    : L('Envoi…', 'جارٍ الإرسال…')
                  : t('kycSubmit')}
              </Button>

              {missing.length > 0 && (
                <p className="text-center text-[12px] text-de9-gray">
                  {L('Il manque : ', 'ينقص: ')}
                  {missing.map((kind) => labels[kind]).join(' · ')}
                </p>
              )}

              {exitTo && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(exitTo)}
                  className="h-10 w-full text-[13px] text-de9-slate"
                  disabled={busy}
                >
                  {kyc.inReview || kyc.verified
                    ? L('Aller à mon espace', 'الذهاب إلى مساحتي')
                    : L('Plus tard, aller à mon espace', 'لاحقًا، الذهاب إلى مساحتي')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
