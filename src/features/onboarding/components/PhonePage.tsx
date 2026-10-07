import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Phone } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useT, useL } from '@/lib/i18n';
import { toProblem } from '@/api/problem';
import { useAuthStore } from '@/stores/authStore';
import { SignupField } from './SignupField';
import { useSetTelephone } from '../api/telephone';
import { isMobile, normalizePhone } from '../lib/phone';
import { routeForStep } from '../lib/registerFlow';
import type { SignupErrorKey } from '../schemas/onboarding';

/**
 * « Votre numéro ». A mobile is the user's own phone; the company line is
 * optional and may be a landline. The answer carries the next onboarding step,
 * which is what decides where this screen hands over.
 */
export function PhonePage() {
  const t = useT();
  const L = useL();
  const navigate = useNavigate();
  const role = useAuthStore((s) => s.user?.role) ?? 'client';
  const setTelephone = useSetTelephone();

  const [phone, setPhone] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  // A SignupErrorKey (translated by SignupField) or the API's own `detail`.
  const [error, setError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);

  const onSubmit = () => {
    // Both fields are judged on every submit, so one that was fixed never keeps
    // the previous attempt's error, and both mistakes show at once.
    const mobile = normalizePhone(phone);
    const mobileOk = mobile !== null && isMobile(mobile);
    const company = companyPhone.trim() ? normalizePhone(companyPhone) : null;
    const companyOk = !companyPhone.trim() || company !== null;
    setError(mobileOk ? null : ('telephone.mobile' satisfies SignupErrorKey));
    setCompanyError(companyOk ? null : ('companyPhone.invalid' satisfies SignupErrorKey));
    if (!mobileOk || !companyOk) return;

    setTelephone.mutate(
      { telephone: mobile, telephoneEntreprise: company },
      {
        onSuccess: (onboarding) => navigate(routeForStep(onboarding.nextStep, role)),
        onError: (err) => {
          const problem = toProblem(err);
          if (problem.field === 'telephone' && problem.detail) setError(problem.detail);
          else if (problem.field === 'telephoneEntreprise' && problem.detail) setCompanyError(problem.detail);
          else toast.error(problem.detail ?? L('Enregistrement impossible.', 'تعذّر الحفظ.'));
        },
      },
    );
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="shadow-modal">
          <CardContent className="p-6 sm:p-7">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-[12px] bg-de9-teal-soft text-de9-teal-dark">
                <Phone className="size-5" />
              </span>
              <h1 className="text-xl font-extrabold text-de9-ink">
                {L('Votre numéro', 'رقم هاتفك')}
              </h1>
            </div>
            <p className="mt-1 text-[13px] text-de9-slate">
              {L(
                'Il sert à vous joindre pour vos missions et à sécuriser votre compte.',
                'نستعمله للتواصل معك بخصوص مهامك ولتأمين حسابك.',
              )}
            </p>

            <div className="mt-5 space-y-4">
              <SignupField
                id="ob-phone"
                type="tel"
                // LTR so the digit groups keep their order in Arabic, right-aligned there.
                dir="ltr"
                className="rtl:text-right"
                label={t('fieldPhone')}
                hint={
                  <>
                    {L('Mobile · ex.', 'نقال · مثال')} <bdi dir="ltr">05 60 00 00 00</bdi>
                  </>
                }
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={error ?? undefined}
              />
              <SignupField
                id="ob-company-phone"
                type="tel"
                dir="ltr"
                className="rtl:text-right"
                label={L("Téléphone de l'entreprise", 'هاتف الشركة')}
                hint={L('Facultatif · fixe accepté', 'اختياري · يمكن أن يكون ثابتًا')}
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                error={companyError ?? undefined}
              />

              <Button
                type="button"
                size="lg"
                onClick={onSubmit}
                className="h-11 w-full text-[15px]"
                disabled={setTelephone.isPending}
              >
                {setTelephone.isPending ? L('Enregistrement…', 'جارٍ الحفظ…') : L('Continuer', 'متابعة')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
