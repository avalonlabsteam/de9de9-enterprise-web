import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/** Shared confirmation screen for the pro (pending review) and client (verified) KYC flows. */
export function KycSuccess({
  variant,
  title,
  body,
  ctaLabel,
  ctaTo,
}: {
  variant: 'pending' | 'verified';
  title: string;
  body: string;
  ctaLabel: string;
  ctaTo: string;
}) {
  const navigate = useNavigate();
  const pending = variant === 'pending';

  return (
    <main className="flex min-h-screen items-center justify-center bg-de9-bg px-4 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="border-de9-line shadow-sm">
          <CardContent className="flex flex-col items-center p-7 text-center sm:p-8">
            <span
              className={
                pending
                  ? 'flex size-16 items-center justify-center rounded-full bg-accent text-de9-teal-dark'
                  : 'flex size-16 items-center justify-center rounded-full bg-[#E5F7F4] text-de9-teal-dark dark:bg-[#14322E]'
              }
            >
              {pending ? <Clock className="size-8" /> : <CheckCircle2 className="size-8" />}
            </span>
            <h1 className="mt-5 text-xl font-extrabold text-de9-ink">{title}</h1>
            <p className="mt-2 max-w-xs text-[14px] text-de9-slate">{body}</p>
            <Button
              type="button"
              size="lg"
              className="mt-6 h-11 w-full text-[15px]"
              onClick={() => navigate(ctaTo)}
            >
              {ctaLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
