import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useL } from '@/lib/i18n';
import { adoptSignIn } from '@/features/auth/api/session';
import { useRegister } from '../api/onboarding';
import type { RegisterPayload } from '../schemas/onboarding';
import { describeRegisterError, routeAfterRegister, type RegisterField } from './registerFlow';

interface Options {
  /**
   * Show the API's message under that input. Return false when this form has no
   * such field — the message then falls back to a toast rather than vanishing.
   */
  onFieldError: (field: RegisterField, message: string) => boolean;
}

/**
 * The half of the sign-up both screens share: post the form, open the session
 * from the answer (no login call follows) and route on `onboarding.nextStep`.
 */
export function useRegisterSubmit({ onFieldError }: Options) {
  const navigate = useNavigate();
  const L = useL();
  const mutation = useRegister();

  const submit = (payload: RegisterPayload): void => {
    mutation.mutate(payload, {
      onSuccess: (session) => {
        // A fresh company has no home yet, so the shell falls back to the name
        // the user just typed.
        adoptSignIn(session, payload.companyName);
        navigate(routeAfterRegister(session));
      },
      onError: (error) => {
        const failure = describeRegisterError(error);
        switch (failure.kind) {
          case 'field':
            if (!onFieldError(failure.field, failure.message)) toast.error(failure.message);
            return;
          case 'emailTaken':
            onFieldError('email', failure.message);
            toast.error(L('Un compte existe déjà avec cet e-mail.', 'يوجد حساب بهذا البريد الإلكتروني.'), {
              action: {
                label: L('Se connecter', 'تسجيل الدخول'),
                onClick: () => navigate('/login'),
              },
            });
            return;
          case 'rateLimited':
            toast.error(L('Trop de tentatives. Réessayez plus tard.', 'محاولات كثيرة. أعد المحاولة لاحقًا.'));
            return;
          default:
            toast.error(failure.message ?? L('Inscription impossible. Réessayez.', 'تعذّر التسجيل. أعد المحاولة.'));
        }
      },
    });
  };

  return { submit, isPending: mutation.isPending };
}
