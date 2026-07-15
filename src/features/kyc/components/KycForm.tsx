import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { PieceSlot } from '@/components/common/PieceSlot';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubmitKyc } from '../api/kyc';
import { kycSubmitSchema, type KycSubmitValues } from '../schemas/kyc';
import { useT, useL } from '@/lib/i18n';

/** Shared KYC uploader used by both the pro and client KYC screens. */
export function KycForm({
  kycKey,
  successPath,
  subtitle,
}: {
  kycKey: string;
  successPath: string;
  subtitle: string;
}) {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const submit = useSubmitKyc(kycKey);

  const { watch, setValue, handleSubmit } = useForm<KycSubmitValues>({
    resolver: zodResolver(kycSubmitSchema),
    defaultValues: { rc: null, nif: null, nis: null },
  });

  const values = watch();

  const onSubmit = () => {
    submit.mutate(undefined, {
      onSuccess: () => navigate(successPath),
    });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-de9-bg px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="border-de9-line shadow-sm">
          <CardContent className="p-6 sm:p-7">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-accent text-de9-teal-dark">
                <ShieldCheck className="size-5" />
              </span>
              <h1 className="text-xl font-extrabold text-de9-ink">{t('kycTitle')}</h1>
            </div>
            <p className="mt-1 text-[13px] text-de9-slate">{subtitle}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-3" noValidate>
              <PieceSlot
                label={t('kycRc')}
                hint={L('PDF ou photo', 'PDF أو صورة')}
                value={values.rc}
                onChange={(f) => setValue('rc', f)}
                fileName="registre-commerce.pdf"
              />
              <PieceSlot
                label={t('kycNif')}
                hint={L("Numéro d'identification fiscale", 'رقم التعريف الجبائي')}
                value={values.nif}
                onChange={(f) => setValue('nif', f)}
                fileName="nif.pdf"
              />
              <PieceSlot
                label={t('kycNis')}
                hint={L("Numéro d'identification statistique", 'رقم التعريف الإحصائي')}
                value={values.nis}
                onChange={(f) => setValue('nis', f)}
                fileName="nis.pdf"
              />

              <Button
                type="submit"
                size="lg"
                className="mt-2 h-11 w-full text-[15px]"
                disabled={submit.isPending}
              >
                {submit.isPending ? L('Chargement…', 'جارٍ…') : t('kycSubmit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
