import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Eye, ShieldCheck, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/common/Logo';
import { PieceSlot, type PieceFile } from '@/components/common/PieceSlot';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useT, useL } from '@/lib/i18n';
import { toProblem } from '@/api/problem';
import { openAuthedFile } from '@/lib/authedFile';
import { kycStateOfDossier, useKycDossier, useSubmitKyc, useUploadKycDocuments } from '../api/kyc';
import {
  KYC_KINDS,
  MAX_FILE_BYTES,
  MAX_REQUEST_BYTES,
  type KycDocument,
  type KycKind,
} from '../schemas/kyc';

const ACCEPT = 'application/pdf,image/*';

type Picked = Partial<Record<KycKind, PieceFile>>;

/**
 * « Vérifier mon entreprise » — the company files RC, NIF and NIS and submits
 * the dossier. Same screen for both sides: the company comes from the token, so
 * no id travels in the URL.
 *
 * It is also the screen a rejection lands on, with de9de9's reason on top and
 * the pieces to replace underneath.
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
  const upload = useUploadKycDocuments();
  const submit = useSubmitKyc();
  const kyc = kycStateOfDossier(dossierQuery.data);

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

  /** The piece on the dossier, unless the user took it off to replace it. */
  const kept = (kind: KycKind): KycDocument | undefined => {
    const doc = stored(kind);
    return doc?.present && !cleared.has(kind) ? doc : undefined;
  };

  /** A piece counts as filed if it is kept on the dossier or just picked. */
  const filed = (kind: KycKind) => !!picked[kind] || !!kept(kind);
  const missing = KYC_KINDS.filter((kind) => !filed(kind));

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
    const files = KYC_KINDS.flatMap((kind) => {
      const file = picked[kind]?.file;
      return file ? [{ kind, file }] : [];
    });

    if (files.reduce((sum, f) => sum + f.file.size, 0) > MAX_REQUEST_BYTES) {
      toast.error(L('Envoi trop lourd : 20 Mo maximum par envoi.', 'الإرسال ثقيل: 20 ميغابايت كحد أقصى.'));
      return;
    }

    try {
      // Upload what is new, then ask for the review. A piece already on the
      // dossier needs no re-upload.
      if (files.length > 0) {
        setProgress(0);
        await upload.mutateAsync({ files, onProgress: setProgress }).finally(() => setProgress(null));
      }
      await submit.mutateAsync();
      setPicked({});
      setCleared(new Set());
      navigate(successPath);
    } catch (error) {
      const problem = toProblem(error);
      if (problem.code === 'kyc_incomplete') {
        toast.error(problem.detail ?? L('Dossier incomplet.', 'الملف غير مكتمل.'));
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

  const busy = upload.isPending || submit.isPending;

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
                  <p className="text-[13px] font-bold">{L('Dossier refusé', 'تم رفض الملف')}</p>
                  {kyc.motif && <p className="mt-0.5 text-[12.5px]">{kyc.motif}</p>}
                  <p className="mt-1 text-[12px]">
                    {L(
                      'Remplacez la pièce concernée puis renvoyez le dossier.',
                      'استبدل الوثيقة المعنية ثم أعد إرسال الملف.',
                    )}
                  </p>
                </div>
              </div>
            )}

            {kyc.inReview && (
              <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-accent px-3.5 py-3 text-de9-teal-dark">
                <Clock className="size-4 flex-none" />
                <p className="text-[12.5px]">
                  {L('Dossier en cours de vérification.', 'الملف قيد التحقق.')}
                </p>
              </div>
            )}

            <div className="mt-5 space-y-3">
              {KYC_KINDS.map((kind) => {
                const doc = kept(kind);
                const value = picked[kind] ?? (doc ? { name: doc.fileName ?? '' } : null);
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
                  />
                  {doc?.url && !picked[kind] && (
                    <button
                      type="button"
                      onClick={() => void preview(doc.url as string)}
                      className="inline-flex items-center gap-1.5 ps-1 text-[12px] font-semibold text-de9-teal-dark hover:underline"
                    >
                      <Eye className="size-3.5" />
                      {L('Voir la pièce déposée', 'عرض الوثيقة المودعة')}
                    </button>
                  )}
                  </div>
                );
              })}

              <Button
                type="button"
                size="lg"
                onClick={() => void onSubmit()}
                className="mt-2 h-11 w-full text-[15px]"
                disabled={busy || missing.length > 0}
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
                  {L('Plus tard, aller à mon espace', 'لاحقًا، الذهاب إلى مساحتي')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
